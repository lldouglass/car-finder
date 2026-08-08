/**
 * Durable, cross-instance backing store for the rate limiter.
 *
 * The in-memory limiter in `lib/rate-limit.ts` is per-lambda-instance, so on
 * Vercel the configured limits are only ever an upper bound per instance. This
 * module moves the counters into Postgres so every instance shares one budget.
 *
 * Design notes:
 *
 * - **Fixed windows.** A window is `[floor(now / windowMs) * windowMs, +windowMs)`,
 *   which makes the row key deterministic without reading state first. The
 *   trade-off is the classic fixed-window burst: a caller can spend a full
 *   allowance at the very end of one window and another at the start of the
 *   next. That is an acceptable 2x worst case here — the previous behaviour was
 *   "unbounded across instances".
 *
 * - **One atomic statement.** `INSERT ... ON CONFLICT DO UPDATE ... WHERE count < limit`
 *   both increments and enforces in a single row-locked statement, so two
 *   instances racing on the same key cannot both be admitted. Denied requests
 *   do not increment, so `count` never runs away.
 *
 * - **No PII.** Identifiers are IP-derived, so the stored key is
 *   `<scope>:<sha256(identifier)>` rather than the raw identifier.
 *
 * Callers should not use this module directly — `checkRateLimit` in
 * `lib/rate-limit.ts` wraps it with a timeout and an in-memory fallback.
 */

import { createHash } from 'node:crypto';
import { prisma } from './db';

export interface ConsumeInput {
    /** Caller-supplied identifier, e.g. `unauth:analysis:1.2.3.4`. Hashed before storage. */
    identifier: string;
    /** Start of the fixed window, in epoch milliseconds. */
    windowStartMs: number;
    /** Window size in milliseconds. */
    windowMs: number;
    /** Maximum requests permitted in the window. */
    limit: number;
}

export interface ConsumeResult {
    allowed: boolean;
    /** Requests consumed in this window. Equals `limit` when the request was denied. */
    count: number;
}

export interface DurableRateLimitStore {
    consume(input: ConsumeInput): Promise<ConsumeResult>;
}

/**
 * Increment-and-enforce in one statement.
 *
 * The `WHERE` on `DO UPDATE` is what makes this safe: when the row is already at
 * the limit the update is skipped and the statement returns zero rows, which we
 * read as "denied". Placeholders are bound by the driver — the SQL string itself
 * is a constant, so nothing caller-controlled reaches the query text.
 */
const CONSUME_SQL = `
    INSERT INTO "RateLimitEntry" ("key", "windowStart", "count", "expiresAt", "updatedAt")
    VALUES ($1, $2, 1, $3, $4)
    ON CONFLICT ("key", "windowStart") DO UPDATE
        SET "count" = "RateLimitEntry"."count" + 1,
            "updatedAt" = $4
        WHERE "RateLimitEntry"."count" < $5
    RETURNING "count"
`;

const CLEANUP_SQL = `DELETE FROM "RateLimitEntry" WHERE "expiresAt" < $1`;

/** Expired rows are swept at most this often per instance. */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

let lastCleanupAt = 0;

/**
 * Builds the stored key. Keeps the human-readable scope (`share`,
 * `unauth:analysis`, ...) so the table stays debuggable, but hashes the whole
 * identifier so the IP itself is never persisted.
 */
export function buildStoreKey(identifier: string): string {
    const segments = identifier.split(':');
    const scope = segments.length > 1 ? segments.slice(0, -1).join(':') : 'default';
    const digest = createHash('sha256').update(identifier).digest('hex').slice(0, 40);
    return `${scope}:${digest}`;
}

/**
 * Best-effort sweep of windows that can no longer be consulted.
 *
 * Deliberately not awaited by `consume`: it is throttled per instance and a
 * failure here is irrelevant to the limiting decision.
 */
function maybeCleanup(nowMs: number): void {
    if (nowMs - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
    lastCleanupAt = nowMs;
    // Cutoff comes from the app clock, not the database's NOW(): window bounds
    // are computed app-side too, and a clock or timezone skew between the two
    // could otherwise delete a window that is still being counted against.
    void prisma.$executeRawUnsafe(CLEANUP_SQL, new Date(nowMs)).catch(() => {
        // Rows simply expire again on the next sweep.
    });
}

export const prismaRateLimitStore: DurableRateLimitStore = {
    async consume({ identifier, windowStartMs, windowMs, limit }: ConsumeInput): Promise<ConsumeResult> {
        const key = buildStoreKey(identifier);
        const now = Date.now();
        const windowStart = new Date(windowStartMs);
        const expiresAt = new Date(windowStartMs + windowMs);

        const rows = await prisma.$queryRawUnsafe<Array<{ count: number | bigint }>>(
            CONSUME_SQL,
            key,
            windowStart,
            expiresAt,
            new Date(now),
            limit
        );

        maybeCleanup(now);

        // Zero rows means the `WHERE count < limit` guard rejected the update.
        if (!rows || rows.length === 0) {
            return { allowed: false, count: limit };
        }

        return { allowed: true, count: Number(rows[0].count) };
    },
};

/** Test hook: forget when the last expiry sweep ran. */
export function __resetCleanupThrottle(): void {
    lastCleanupAt = 0;
}

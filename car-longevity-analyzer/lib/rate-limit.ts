/**
 * Rate limiting utility.
 *
 * `checkRateLimit` consults a durable, cross-instance store (Postgres, via
 * `lib/rate-limit-store.ts`) so the configured limits hold globally instead of
 * per lambda instance.
 *
 * FAIL-OPEN BY DESIGN: the store is reached through a timeout and a circuit
 * breaker, and any failure — missing table, unreachable database, slow query —
 * degrades to the in-memory limiter below rather than erroring the request.
 * `package.json`'s build step runs `prisma generate` only, never
 * `prisma migrate deploy`, so a deploy can legitimately reach production before
 * the `RateLimitEntry` migration is applied. That must not 500 the site; it
 * should quietly behave the way it did before this module gained a store.
 *
 * Consequence worth knowing: while the store is unavailable the limits are once
 * again per-instance and reset on cold start, so they bound cost rather than
 * eliminate abuse. Watch for the "durable rate limit store unavailable" warning.
 *
 * Client-supplied `x-forwarded-for` is not a bypass — Vercel normalises the
 * header at the edge before the function sees it.
 */

import { RATE_LIMIT_DEFAULTS } from './constants';
import type { DurableRateLimitStore } from './rate-limit-store';

interface RateLimitEntry {
    timestamps: number[];
}

// In-memory store, used as the fail-open fallback (per-process, resets on restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/** How long a single durable-store call may take before we fall back. */
const DURABLE_TIMEOUT_MS = 1_500;

/** After a store failure, skip the store entirely for this long. */
const DURABLE_COOLDOWN_MS = 30_000;

/**
 * Cleans up expired entries from the rate limit store
 */
function cleanupExpiredEntries(windowMs: number): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        const validTimestamps = entry.timestamps.filter(t => t > now - windowMs);
        if (validTimestamps.length === 0) {
            rateLimitStore.delete(key);
        } else {
            entry.timestamps = validTimestamps;
        }
    }
}

// Start cleanup interval
let cleanupIntervalId: NodeJS.Timeout | null = null;

function ensureCleanupInterval(): void {
    if (cleanupIntervalId === null && typeof setInterval !== 'undefined') {
        cleanupIntervalId = setInterval(
            () => cleanupExpiredEntries(RATE_LIMIT_DEFAULTS.windowMs),
            CLEANUP_INTERVAL_MS
        );
        // Don't prevent process exit
        if (cleanupIntervalId.unref) {
            cleanupIntervalId.unref();
        }
    }
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterMs: number | null;
}

// --- Durable store plumbing -------------------------------------------------

let storeOverride: DurableRateLimitStore | null = null;
let storeLoad: Promise<DurableRateLimitStore> | null = null;

/** Epoch ms until which the durable store is considered down. */
let durableUnavailableUntil = 0;

/** Epoch ms of the last outage warning, so a persistent outage doesn't spam logs. */
let lastOutageLogAt = 0;

class RateLimitStoreTimeoutError extends Error {
    constructor(ms: number) {
        super(`Durable rate limit store did not respond within ${ms}ms`);
        this.name = 'RateLimitStoreTimeoutError';
    }
}

/**
 * Test hook: swap in a fake store, or pass `null` to restore the real one.
 */
export function __setRateLimitStore(store: DurableRateLimitStore | null): void {
    storeOverride = store;
    storeLoad = null;
}

/** Test hook: close the circuit breaker. */
export function __resetDurableCircuit(): void {
    durableUnavailableUntil = 0;
    lastOutageLogAt = 0;
}

function isDurableEnabled(): boolean {
    if (process.env.RATE_LIMIT_DURABLE === 'off') return false;
    if (storeOverride) return true;
    // Without a database there is nothing to talk to; skip the import entirely
    // so tests and `next dev` without Postgres don't pay for a doomed call.
    return Boolean(process.env.DATABASE_URL);
}

/**
 * Loads the Prisma-backed store lazily. Importing it eagerly would construct a
 * PrismaClient at module load, which breaks importing this file in environments
 * that have no database (unit tests, local dev without Postgres).
 */
function getStore(): Promise<DurableRateLimitStore> {
    if (storeOverride) return Promise.resolve(storeOverride);
    if (!storeLoad) {
        storeLoad = import('./rate-limit-store').then(m => m.prismaRateLimitStore);
    }
    return storeLoad;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new RateLimitStoreTimeoutError(ms)), ms);
    });
    // `Promise.race` attaches handlers to both, so a late rejection from
    // `promise` is still considered handled and won't crash the process.
    return Promise.race([promise, timeout]).finally(() => {
        if (timer) clearTimeout(timer);
    });
}

function recordDurableFailure(error: unknown, now: number): void {
    durableUnavailableUntil = now + DURABLE_COOLDOWN_MS;
    // Drop a possibly-rejected module load so the retry after the cooldown
    // gets a fresh attempt rather than replaying the same rejection.
    storeLoad = null;
    // Log the first failure immediately, then at most once per cooldown.
    if (lastOutageLogAt !== 0 && now - lastOutageLogAt < DURABLE_COOLDOWN_MS) return;
    lastOutageLogAt = now;
    console.warn(
        '[rate-limit] durable rate limit store unavailable, falling back to ' +
        'per-instance in-memory limits. If this persists, apply the ' +
        'RateLimitEntry migration (prisma migrate deploy).',
        error instanceof Error ? error.message : error
    );
}

// --- Public API -------------------------------------------------------------

/**
 * Checks if a request should be rate limited, and consumes one unit of the
 * caller's allowance when it is permitted.
 *
 * Backed by the shared store when it is reachable, and by the per-instance
 * in-memory limiter otherwise (see the fail-open note at the top of the file).
 *
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with rate limit status
 */
export async function checkRateLimit(
    identifier: string,
    limit: number = RATE_LIMIT_DEFAULTS.maxRequests,
    windowMs: number = RATE_LIMIT_DEFAULTS.windowMs
): Promise<RateLimitResult> {
    const now = Date.now();

    // A non-positive allowance admits nobody; short-circuit so neither backend
    // has to encode that case.
    if (limit <= 0) {
        return { allowed: false, remaining: 0, resetAt: now + windowMs, retryAfterMs: windowMs };
    }

    const windowIsUsable = Number.isFinite(windowMs) && windowMs > 0;

    if (windowIsUsable && isDurableEnabled() && now >= durableUnavailableUntil) {
        // A fixed window keyed off the clock: no read needed to know which row
        // to touch, and every instance agrees on the boundary.
        const windowStartMs = Math.floor(now / windowMs) * windowMs;
        const resetAt = windowStartMs + windowMs;

        try {
            const store = await getStore();
            const { allowed, count } = await withTimeout(
                store.consume({ identifier, windowStartMs, windowMs, limit }),
                DURABLE_TIMEOUT_MS
            );

            return {
                allowed,
                remaining: Math.max(0, limit - count),
                resetAt,
                retryAfterMs: allowed ? null : Math.max(0, resetAt - now),
            };
        } catch (error) {
            recordDurableFailure(error, now);
            // fall through to the in-memory limiter
        }
    }

    return checkRateLimitInMemory(identifier, limit, windowMs);
}

/**
 * Per-instance sliding-window limiter.
 *
 * Exported for tests and as the documented fallback path; prefer
 * `checkRateLimit`, which reaches for the shared store first.
 */
export function checkRateLimitInMemory(
    identifier: string,
    limit: number = RATE_LIMIT_DEFAULTS.maxRequests,
    windowMs: number = RATE_LIMIT_DEFAULTS.windowMs
): RateLimitResult {
    ensureCleanupInterval();

    const now = Date.now();
    const windowStart = now - windowMs;

    if (limit <= 0) {
        return { allowed: false, remaining: 0, resetAt: now + windowMs, retryAfterMs: windowMs };
    }

    // Get or create entry
    let entry = rateLimitStore.get(identifier);
    if (!entry) {
        entry = { timestamps: [] };
        rateLimitStore.set(identifier, entry);
    }

    // Filter to only recent timestamps within the window
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    // Check if limit exceeded
    if (entry.timestamps.length >= limit) {
        // Find when the oldest request in window will expire
        const oldestInWindow = Math.min(...entry.timestamps);
        const resetAt = oldestInWindow + windowMs;
        const retryAfterMs = resetAt - now;

        return {
            allowed: false,
            remaining: 0,
            resetAt,
            retryAfterMs: Math.max(0, retryAfterMs)
        };
    }

    // Add current request timestamp
    entry.timestamps.push(now);

    return {
        allowed: true,
        remaining: limit - entry.timestamps.length,
        resetAt: entry.timestamps[0] + windowMs,
        retryAfterMs: null
    };
}

/**
 * Creates a rate limiter middleware for API routes.
 *
 * @param limit - Maximum requests per window
 * @param windowMs - Window size in milliseconds
 * @returns Function that checks rate limit for a given identifier
 */
export function createRateLimiter(
    limit: number = RATE_LIMIT_DEFAULTS.maxRequests,
    windowMs: number = RATE_LIMIT_DEFAULTS.windowMs
) {
    return (identifier: string): Promise<RateLimitResult> => {
        return checkRateLimit(identifier, limit, windowMs);
    };
}

/**
 * Extracts client identifier from request headers.
 * Handles common proxy headers for IP detection.
 */
export function getClientIdentifier(request: Request): string {
    // Check common proxy headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // Take the first IP in the chain (original client)
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback - in serverless, there's no reliable way to get IP
    // Return a hash of user-agent as a weak identifier
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `ua:${hashString(userAgent)}`;
}

/**
 * Simple string hash for fallback identifier
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Resets the in-memory rate limit for a specific identifier.
 * Useful for testing or admin actions. Does not touch the durable store.
 */
export function resetRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
}

/**
 * Clears all in-memory rate limit data. Does not touch the durable store.
 * Useful for testing.
 */
export function clearAllRateLimits(): void {
    rateLimitStore.clear();
}

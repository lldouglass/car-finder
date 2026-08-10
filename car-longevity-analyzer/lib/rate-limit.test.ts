import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    __resetDurableCircuit,
    __setRateLimitStore,
    checkRateLimit,
    checkRateLimitInMemory,
    clearAllRateLimits,
    createRateLimiter,
    getClientIdentifier,
    resetRateLimit,
} from './rate-limit';
import type { ConsumeInput, DurableRateLimitStore } from './rate-limit-store';

const DURABLE_TIMEOUT_MS = 1_500;
const DURABLE_COOLDOWN_MS = 30_000;

/** An in-process stand-in for the Postgres store, with the same fixed-window semantics. */
function fakeStore(): DurableRateLimitStore & { consume: ReturnType<typeof vi.fn> } {
    const counts = new Map<string, number>();
    const consume = vi.fn(async ({ identifier, windowStartMs, limit }: ConsumeInput) => {
        const key = `${identifier}@${windowStartMs}`;
        const next = (counts.get(key) ?? 0) + 1;
        if (next > limit) return { allowed: false, count: limit };
        counts.set(key, next);
        return { allowed: true, count: next };
    });
    return { consume };
}

let originalDatabaseUrl: string | undefined;
let originalDurableFlag: string | undefined;

beforeEach(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    originalDurableFlag = process.env.RATE_LIMIT_DURABLE;
    // Deterministic default: no database, no store override => in-memory only.
    delete process.env.DATABASE_URL;
    delete process.env.RATE_LIMIT_DURABLE;

    clearAllRateLimits();
    __setRateLimitStore(null);
    __resetDurableCircuit();
    vi.spyOn(console, 'warn').mockImplementation(() => { });
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    __setRateLimitStore(null);
    __resetDurableCircuit();
    clearAllRateLimits();

    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalDurableFlag === undefined) delete process.env.RATE_LIMIT_DURABLE;
    else process.env.RATE_LIMIT_DURABLE = originalDurableFlag;
});

describe('checkRateLimitInMemory', () => {
    it('allows requests up to the limit and denies the next one', () => {
        for (let i = 0; i < 3; i++) {
            expect(checkRateLimitInMemory('mem:a', 3, 60_000).allowed).toBe(true);
        }
        const denied = checkRateLimitInMemory('mem:a', 3, 60_000);
        expect(denied.allowed).toBe(false);
        expect(denied.remaining).toBe(0);
        expect(denied.retryAfterMs).toBeGreaterThan(0);
    });

    it('reports remaining allowance and no retry hint while allowed', () => {
        const first = checkRateLimitInMemory('mem:b', 3, 60_000);
        expect(first.remaining).toBe(2);
        expect(first.retryAfterMs).toBeNull();
        expect(checkRateLimitInMemory('mem:b', 3, 60_000).remaining).toBe(1);
    });

    it('tracks identifiers independently', () => {
        expect(checkRateLimitInMemory('mem:c', 1, 60_000).allowed).toBe(true);
        expect(checkRateLimitInMemory('mem:c', 1, 60_000).allowed).toBe(false);
        expect(checkRateLimitInMemory('mem:d', 1, 60_000).allowed).toBe(true);
    });

    it('frees the allowance once the window slides past', () => {
        vi.useFakeTimers();
        expect(checkRateLimitInMemory('mem:e', 1, 60_000).allowed).toBe(true);
        expect(checkRateLimitInMemory('mem:e', 1, 60_000).allowed).toBe(false);

        vi.advanceTimersByTime(60_001);
        expect(checkRateLimitInMemory('mem:e', 1, 60_000).allowed).toBe(true);
    });

    it('denies everything when the limit is not positive', () => {
        expect(checkRateLimitInMemory('mem:f', 0, 60_000).allowed).toBe(false);
    });

    it('forgets an identifier on reset', () => {
        expect(checkRateLimitInMemory('mem:g', 1, 60_000).allowed).toBe(true);
        expect(checkRateLimitInMemory('mem:g', 1, 60_000).allowed).toBe(false);
        resetRateLimit('mem:g');
        expect(checkRateLimitInMemory('mem:g', 1, 60_000).allowed).toBe(true);
    });
});

describe('checkRateLimit with a durable store', () => {
    it('enforces the limit through the store', async () => {
        const store = fakeStore();
        __setRateLimitStore(store);

        expect((await checkRateLimit('unauth:analysis:1.1.1.1', 2, 60_000)).allowed).toBe(true);
        expect((await checkRateLimit('unauth:analysis:1.1.1.1', 2, 60_000)).allowed).toBe(true);

        const denied = await checkRateLimit('unauth:analysis:1.1.1.1', 2, 60_000);
        expect(denied.allowed).toBe(false);
        expect(denied.remaining).toBe(0);
        expect(denied.retryAfterMs).toBeGreaterThan(0);
    });

    it('shares one budget across instances, which the in-memory limiter cannot', async () => {
        // Two "instances" only differ by their in-memory map; both reach the
        // same store, so the third request is denied no matter who serves it.
        const store = fakeStore();
        __setRateLimitStore(store);

        await checkRateLimit('unauth:analysis:2.2.2.2', 2, 60_000);
        await checkRateLimit('unauth:analysis:2.2.2.2', 2, 60_000);
        clearAllRateLimits(); // simulate a cold start wiping local state

        expect((await checkRateLimit('unauth:analysis:2.2.2.2', 2, 60_000)).allowed).toBe(false);
    });

    it('aligns the window to a deterministic boundary so every instance agrees', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-08T12:34:56.789Z'));
        const store = fakeStore();
        __setRateLimitStore(store);

        const windowMs = 60 * 60 * 1000;
        const result = await checkRateLimit('share:3.3.3.3', 10, windowMs);

        const { windowStartMs } = store.consume.mock.calls[0][0] as ConsumeInput;
        expect(windowStartMs % windowMs).toBe(0);
        expect(windowStartMs).toBe(Date.parse('2026-08-08T12:00:00.000Z'));
        expect(result.resetAt).toBe(Date.parse('2026-08-08T13:00:00.000Z'));
    });

    it('reports remaining allowance from the store count', async () => {
        __setRateLimitStore({ consume: async () => ({ allowed: true, count: 4 }) });
        expect((await checkRateLimit('share:4.4.4.4', 10, 60_000)).remaining).toBe(6);
    });

    it('never reports negative remaining', async () => {
        __setRateLimitStore({ consume: async () => ({ allowed: true, count: 12 }) });
        expect((await checkRateLimit('share:4.4.4.4', 10, 60_000)).remaining).toBe(0);
    });

    it('does not consult the store when the limit is not positive', async () => {
        const store = fakeStore();
        __setRateLimitStore(store);

        expect((await checkRateLimit('share:5.5.5.5', 0, 60_000)).allowed).toBe(false);
        expect(store.consume).not.toHaveBeenCalled();
    });

    it('skips the store entirely when RATE_LIMIT_DURABLE=off', async () => {
        const store = fakeStore();
        __setRateLimitStore(store);
        process.env.RATE_LIMIT_DURABLE = 'off';

        expect((await checkRateLimit('share:6.6.6.6', 1, 60_000)).allowed).toBe(true);
        expect((await checkRateLimit('share:6.6.6.6', 1, 60_000)).allowed).toBe(false);
        expect(store.consume).not.toHaveBeenCalled();
    });

    it('skips the store when no DATABASE_URL is configured', async () => {
        // No override and no database: nothing to load, so no doomed import.
        expect((await checkRateLimit('share:7.7.7.7', 1, 60_000)).allowed).toBe(true);
        expect((await checkRateLimit('share:7.7.7.7', 1, 60_000)).allowed).toBe(false);
    });
});

describe('fail-open behaviour', () => {
    const missingTable = () =>
        Promise.reject(new Error('relation "RateLimitEntry" does not exist'));

    it('serves the request from memory instead of throwing when the table is missing', async () => {
        __setRateLimitStore({ consume: missingTable });

        const result = await checkRateLimit('unauth:analysis:8.8.8.8', 3, 60_000);
        expect(result.allowed).toBe(true);
    });

    it('still enforces a per-instance limit while the store is down', async () => {
        // Fail-open must not mean "unlimited".
        __setRateLimitStore({ consume: missingTable });

        for (let i = 0; i < 3; i++) {
            expect((await checkRateLimit('unauth:analysis:9.9.9.9', 3, 60_000)).allowed).toBe(true);
        }
        expect((await checkRateLimit('unauth:analysis:9.9.9.9', 3, 60_000)).allowed).toBe(false);
    });

    it('warns once so a missing migration is visible in logs', async () => {
        __setRateLimitStore({ consume: missingTable });

        await checkRateLimit('share:10.0.0.1', 5, 60_000);
        await checkRateLimit('share:10.0.0.2', 5, 60_000);

        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('durable rate limit store unavailable');
    });

    it('stops calling a failing store until the cooldown expires', async () => {
        vi.useFakeTimers();
        const consume = vi.fn(missingTable);
        __setRateLimitStore({ consume });

        await checkRateLimit('share:10.0.0.3', 5, 60_000);
        expect(consume).toHaveBeenCalledTimes(1);

        await checkRateLimit('share:10.0.0.3', 5, 60_000);
        await checkRateLimit('share:10.0.0.3', 5, 60_000);
        expect(consume).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(DURABLE_COOLDOWN_MS + 1);
        await checkRateLimit('share:10.0.0.3', 5, 60_000);
        expect(consume).toHaveBeenCalledTimes(2);
    });

    it('resumes using the store once it recovers', async () => {
        vi.useFakeTimers();
        const healthy = fakeStore();
        const consume = vi.fn()
            .mockImplementationOnce(missingTable)
            .mockImplementation(healthy.consume);
        __setRateLimitStore({ consume });

        await checkRateLimit('share:10.0.0.4', 1, 60_000);
        vi.advanceTimersByTime(DURABLE_COOLDOWN_MS + 1);

        // Store is healthy again: it owns the decision, and its fresh counter
        // allows one request before denying the next.
        expect((await checkRateLimit('share:10.0.0.4', 1, 60_000)).allowed).toBe(true);
        expect((await checkRateLimit('share:10.0.0.4', 1, 60_000)).allowed).toBe(false);
    });

    it('falls back when the store hangs past the timeout', async () => {
        vi.useFakeTimers();
        const consume = vi.fn(() => new Promise<never>(() => { }));
        __setRateLimitStore({ consume });

        const pending = checkRateLimit('share:10.0.0.5', 2, 60_000);
        await vi.advanceTimersByTimeAsync(DURABLE_TIMEOUT_MS + 10);

        await expect(pending).resolves.toMatchObject({ allowed: true });
        expect(consume).toHaveBeenCalledTimes(1);
    });
});

describe('createRateLimiter', () => {
    it('binds the limit and window', async () => {
        const limiter = createRateLimiter(1, 60_000);
        expect((await limiter('bound:1')).allowed).toBe(true);
        expect((await limiter('bound:1')).allowed).toBe(false);
        expect((await limiter('bound:2')).allowed).toBe(true);
    });
});

describe('getClientIdentifier', () => {
    const req = (headers: Record<string, string>) => new Request('https://example.com', { headers });

    it('prefers the first hop of x-forwarded-for', () => {
        expect(getClientIdentifier(req({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18' })))
            .toBe('203.0.113.7');
    });

    it('falls back to x-real-ip', () => {
        expect(getClientIdentifier(req({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
    });

    it('falls back to a user-agent hash when no IP header is present', () => {
        const id = getClientIdentifier(req({ 'user-agent': 'curl/8.0' }));
        expect(id).toMatch(/^ua:[0-9a-z]+$/);
        expect(getClientIdentifier(req({ 'user-agent': 'curl/8.0' }))).toBe(id);
        expect(getClientIdentifier(req({ 'user-agent': 'curl/8.1' }))).not.toBe(id);
    });
});

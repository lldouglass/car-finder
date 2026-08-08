import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
    mockPrisma: {
        $queryRawUnsafe: vi.fn(),
        $executeRawUnsafe: vi.fn(),
    },
}));

vi.mock('./db', () => ({ prisma: mockPrisma }));

import { prismaRateLimitStore, buildStoreKey, __resetCleanupThrottle } from './rate-limit-store';

const WINDOW_MS = 60 * 60 * 1000;
const WINDOW_START = 1_770_000_000_000;

beforeEach(() => {
    mockPrisma.$queryRawUnsafe.mockReset();
    mockPrisma.$executeRawUnsafe.mockReset();
    mockPrisma.$executeRawUnsafe.mockResolvedValue(0);
    __resetCleanupThrottle();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('buildStoreKey', () => {
    it('never stores the raw identifier', () => {
        const key = buildStoreKey('unauth:analysis:203.0.113.7');
        expect(key).not.toContain('203.0.113.7');
    });

    it('keeps the scope readable so the table can be triaged', () => {
        expect(buildStoreKey('unauth:analysis:203.0.113.7')).toMatch(/^unauth:analysis:[0-9a-f]{40}$/);
        expect(buildStoreKey('share:203.0.113.7')).toMatch(/^share:[0-9a-f]{40}$/);
        expect(buildStoreKey('vehicle-history:203.0.113.7')).toMatch(/^vehicle-history:[0-9a-f]{40}$/);
    });

    it('falls back to a default scope for identifiers with no prefix', () => {
        expect(buildStoreKey('203.0.113.7')).toMatch(/^default:[0-9a-f]{40}$/);
    });

    it('is stable for the same identifier and distinct across identifiers', () => {
        expect(buildStoreKey('share:1.1.1.1')).toBe(buildStoreKey('share:1.1.1.1'));
        expect(buildStoreKey('share:1.1.1.1')).not.toBe(buildStoreKey('share:1.1.1.2'));
        // Same IP, different limit: must not share a bucket.
        expect(buildStoreKey('share:1.1.1.1')).not.toBe(buildStoreKey('unauth:analysis:1.1.1.1'));
    });
});

describe('prismaRateLimitStore.consume', () => {
    it('allows and reports the new count when the statement returns a row', async () => {
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 3 }]);

        const result = await prismaRateLimitStore.consume({
            identifier: 'share:203.0.113.7',
            windowStartMs: WINDOW_START,
            windowMs: WINDOW_MS,
            limit: 10,
        });

        expect(result).toEqual({ allowed: true, count: 3 });
    });

    it('denies when the statement returns no rows', async () => {
        // Zero rows means the `WHERE count < limit` guard skipped the update.
        mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

        const result = await prismaRateLimitStore.consume({
            identifier: 'share:203.0.113.7',
            windowStartMs: WINDOW_START,
            windowMs: WINDOW_MS,
            limit: 10,
        });

        expect(result).toEqual({ allowed: false, count: 10 });
    });

    it('coerces a bigint count from the driver', async () => {
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(2) }]);

        const result = await prismaRateLimitStore.consume({
            identifier: 'share:203.0.113.7',
            windowStartMs: WINDOW_START,
            windowMs: WINDOW_MS,
            limit: 10,
        });

        expect(result).toEqual({ allowed: true, count: 2 });
    });

    it('binds the hashed key, window bounds and limit as parameters', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(WINDOW_START + 1_234));
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 1 }]);

        await prismaRateLimitStore.consume({
            identifier: 'unauth:analysis:203.0.113.7',
            windowStartMs: WINDOW_START,
            windowMs: WINDOW_MS,
            limit: 3,
        });

        const [sql, key, windowStart, expiresAt, updatedAt, limit] =
            mockPrisma.$queryRawUnsafe.mock.calls[0];
        expect(key).toBe(buildStoreKey('unauth:analysis:203.0.113.7'));
        expect(windowStart).toEqual(new Date(WINDOW_START));
        expect(expiresAt).toEqual(new Date(WINDOW_START + WINDOW_MS));
        expect(updatedAt).toEqual(new Date(WINDOW_START + 1_234));
        expect(limit).toBe(3);
        // The identifier must reach Postgres as a bound parameter, never as SQL text.
        expect(sql).not.toContain('203.0.113.7');
    });

    it('never compares against the database clock', async () => {
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 1 }]);

        await prismaRateLimitStore.consume({
            identifier: 'share:203.0.113.7',
            windowStartMs: WINDOW_START,
            windowMs: WINDOW_MS,
            limit: 10,
        });

        // Window bounds are computed app-side, so timestamps must be bound
        // params. Mixing in NOW() would reintroduce clock/timezone skew.
        expect(mockPrisma.$queryRawUnsafe.mock.calls[0][0]).not.toContain('NOW()');
    });

    it('enforces the limit inside the single atomic statement', async () => {
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 1 }]);

        await prismaRateLimitStore.consume({
            identifier: 'share:203.0.113.7',
            windowStartMs: WINDOW_START,
            windowMs: WINDOW_MS,
            limit: 10,
        });

        const sql = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
        // If any of these disappear, two instances can be admitted past the limit.
        expect(sql).toContain('ON CONFLICT ("key", "windowStart") DO UPDATE');
        expect(sql).toContain('"RateLimitEntry"."count" + 1');
        expect(sql).toContain('WHERE "RateLimitEntry"."count" < $5');
        expect(sql).toContain('RETURNING "count"');
    });

    it('propagates store errors so the caller can fail open', async () => {
        mockPrisma.$queryRawUnsafe.mockRejectedValue(
            new Error('relation "RateLimitEntry" does not exist')
        );

        await expect(
            prismaRateLimitStore.consume({
                identifier: 'share:203.0.113.7',
                windowStartMs: WINDOW_START,
                windowMs: WINDOW_MS,
                limit: 10,
            })
        ).rejects.toThrow(/does not exist/);
    });
});

describe('expired-window cleanup', () => {
    const consume = () =>
        prismaRateLimitStore.consume({
            identifier: 'share:203.0.113.7',
            windowStartMs: WINDOW_START,
            windowMs: WINDOW_MS,
            limit: 10,
        });

    it('sweeps expired rows, then throttles subsequent sweeps', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(WINDOW_START));
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 1 }]);

        await consume();
        expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
        const [cleanupSql, cutoff] = mockPrisma.$executeRawUnsafe.mock.calls[0];
        expect(cleanupSql).toContain('DELETE FROM "RateLimitEntry"');
        expect(cleanupSql).not.toContain('NOW()');
        expect(cutoff).toEqual(new Date(WINDOW_START));

        vi.advanceTimersByTime(60_000);
        await consume();
        expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(10 * 60 * 1000);
        await consume();
        expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(2);
    });

    it('still returns a decision when the sweep fails', async () => {
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 1 }]);
        mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('permission denied'));

        await expect(consume()).resolves.toEqual({ allowed: true, count: 1 });
    });
});

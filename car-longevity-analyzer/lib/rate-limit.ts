/**
 * Simple in-memory rate limiting utility.
 * For production, consider using Redis or a dedicated rate limiting service.
 */

import { RATE_LIMIT_DEFAULTS } from './constants';

interface RateLimitEntry {
    timestamps: number[];
}

// In-memory store for rate limiting (per-process, resets on restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

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

/**
 * Checks if a request should be rate limited.
 *
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with rate limit status
 */
export function checkRateLimit(
    identifier: string,
    limit: number = RATE_LIMIT_DEFAULTS.maxRequests,
    windowMs: number = RATE_LIMIT_DEFAULTS.windowMs
): RateLimitResult {
    ensureCleanupInterval();

    const now = Date.now();
    const windowStart = now - windowMs;

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
    return (identifier: string): RateLimitResult => {
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
 * Resets rate limit for a specific identifier.
 * Useful for testing or admin actions.
 */
export function resetRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
}

/**
 * Clears all rate limit data.
 * Useful for testing.
 */
export function clearAllRateLimits(): void {
    rateLimitStore.clear();
}

/**
 * Vehicle History Cache and Management
 *
 * Provides caching for VinAudit API responses to avoid duplicate charges
 * and rate limits.
 */

import {
    getVehicleHistory,
    analyzeHistorySeverity,
    isVinAuditConfigured,
    type VehicleHistory,
    type VehicleHistoryResult,
} from './vinaudit';

// In-memory cache (in production, use Redis or similar)
const historyCache = new Map<string, { data: VehicleHistory; timestamp: number }>();

// Cache configuration
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000; // Maximum number of cached entries

// Usage tracking
let apiCallCount = 0;
const DAILY_LIMIT = 100; // Conservative daily limit
let lastResetDate = new Date().toDateString();

/**
 * Resets the daily API call counter if it's a new day.
 */
function checkDailyReset(): void {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
        apiCallCount = 0;
        lastResetDate = today;
    }
}

/**
 * Checks if the daily API limit has been reached.
 */
export function isDailyLimitReached(): boolean {
    checkDailyReset();
    return apiCallCount >= DAILY_LIMIT;
}

/**
 * Gets the remaining API calls for today.
 */
export function getRemainingCalls(): number {
    checkDailyReset();
    return Math.max(0, DAILY_LIMIT - apiCallCount);
}

/**
 * Cleans up old cache entries.
 */
function cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(historyCache.entries());

    // Remove expired entries
    for (const [vin, entry] of entries) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            historyCache.delete(vin);
        }
    }

    // If still over limit, remove oldest entries
    if (historyCache.size > MAX_CACHE_SIZE) {
        const sortedEntries = entries
            .filter(([vin]) => historyCache.has(vin)) // Only entries still in cache
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toRemove = sortedEntries.slice(0, historyCache.size - MAX_CACHE_SIZE);
        for (const [vin] of toRemove) {
            historyCache.delete(vin);
        }
    }
}

/**
 * Fetches vehicle history with caching.
 *
 * @param vin - The VIN to look up
 * @param forceRefresh - If true, bypasses cache
 * @returns Vehicle history result with cache status
 */
export async function fetchVehicleHistory(
    vin: string,
    forceRefresh: boolean = false
): Promise<VehicleHistoryResult & { cached?: boolean; remainingCalls?: number }> {
    const normalizedVin = vin.toUpperCase();

    // Check if VinAudit is configured
    if (!isVinAuditConfigured()) {
        return {
            success: false,
            error: 'Vehicle history lookup is not configured. Please set VINAUDIT_API_KEY.',
        };
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cached = historyCache.get(normalizedVin);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return {
                success: true,
                data: cached.data,
                cached: true,
                remainingCalls: getRemainingCalls(),
            };
        }
    }

    // Check daily limit
    checkDailyReset();
    if (isDailyLimitReached()) {
        return {
            success: false,
            error: 'Daily API limit reached. Please try again tomorrow.',
            remainingCalls: 0,
        };
    }

    // Fetch from API
    const result = await getVehicleHistory(normalizedVin);

    if (result.success && result.data) {
        // Update cache
        cleanupCache();
        historyCache.set(normalizedVin, {
            data: result.data,
            timestamp: Date.now(),
        });

        // Increment API call counter
        apiCallCount++;

        return {
            ...result,
            cached: false,
            remainingCalls: getRemainingCalls(),
        };
    }

    return {
        ...result,
        cached: false,
        remainingCalls: getRemainingCalls(),
    };
}

/**
 * Checks if a VIN is in the cache.
 */
export function isInCache(vin: string): boolean {
    const normalizedVin = vin.toUpperCase();
    const cached = historyCache.get(normalizedVin);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_TTL_MS;
}

/**
 * Gets usage statistics.
 */
export function getUsageStats(): {
    todaysCalls: number;
    remainingCalls: number;
    cacheSize: number;
    isConfigured: boolean;
} {
    checkDailyReset();
    return {
        todaysCalls: apiCallCount,
        remainingCalls: getRemainingCalls(),
        cacheSize: historyCache.size,
        isConfigured: isVinAuditConfigured(),
    };
}

// Re-export types and utilities from vinaudit
export {
    analyzeHistorySeverity,
    isVinAuditConfigured,
    type VehicleHistory,
    type VehicleHistoryResult,
    type TitleRecord,
    type OdometerRecord,
} from './vinaudit';

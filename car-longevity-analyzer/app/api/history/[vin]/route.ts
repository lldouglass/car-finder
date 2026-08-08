/**
 * Vehicle History API Endpoint
 *
 * GET /api/history/[vin]
 *
 * Fetches vehicle history from VinAudit (NMVTIS data) including:
 * - Title brands (salvage, rebuilt, flood, etc.)
 * - Odometer records and discrepancy detection
 * - Theft records
 * - Total loss records
 */

import { NextResponse } from 'next/server';
import {
    fetchVehicleHistory,
    analyzeHistorySeverity,
    getUsageStats,
    isVinAuditConfigured,
} from '@/lib/vehicle-history';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { VEHICLE_HISTORY_RATE_LIMIT } from '@/lib/constants';

// VIN validation regex (17 alphanumeric, excluding I, O, Q)
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ vin: string }> }
) {
    try {
        const { vin } = await params;

        // Validate VIN format
        if (!vin || !VIN_REGEX.test(vin)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid VIN format. Must be 17 characters (A-Z, 0-9, excluding I, O, Q).',
                },
                { status: 400 }
            );
        }

        // Every call here can spend a paid VinAudit lookup, so cap per client
        // before the shared daily quota is ever touched.
        const rateLimit = await checkRateLimit(
            `vehicle-history:${getClientIdentifier(request)}`,
            VEHICLE_HISTORY_RATE_LIMIT.maxRequests,
            VEHICLE_HISTORY_RATE_LIMIT.windowMs
        );
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many vehicle history lookups. Please try again later.',
                },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.retryAfterMs ?? 60_000) / 1000)) } }
            );
        }

        // Check if feature is configured
        if (!isVinAuditConfigured()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Vehicle history lookup is not available. API key not configured.',
                    featureAvailable: false,
                },
                { status: 503 }
            );
        }

        // Fetch history (uses cache if available)
        const result = await fetchVehicleHistory(vin);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    cached: result.cached,
                    remainingCalls: result.remainingCalls,
                },
                { status: result.error?.includes('limit') ? 429 : 404 }
            );
        }

        // Analyze severity
        const analysis = result.data ? analyzeHistorySeverity(result.data) : null;

        return NextResponse.json({
            success: true,
            history: result.data,
            analysis: analysis ? {
                hasCriticalIssue: analysis.hasCriticalIssue,
                hasHighRiskIssue: analysis.hasHighRiskIssue,
                issues: analysis.issues,
                recommendation: analysis.hasCriticalIssue
                    ? 'AVOID - Critical title or history issues detected'
                    : analysis.hasHighRiskIssue
                    ? 'CAUTION - Significant history concerns found'
                    : 'No major history issues detected',
            } : null,
            cached: result.cached,
            remainingCalls: result.remainingCalls,
        });

    } catch (error) {
        console.error('Error in vehicle history endpoint:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/history/status
 *
 * Returns the status of the vehicle history feature.
 */
export async function HEAD() {
    const stats = getUsageStats();

    // Availability only — remaining quota and cache size are operational
    // details that would tell an abuser exactly how much budget is left.
    return new NextResponse(null, {
        status: stats.isConfigured ? 200 : 503,
        headers: {
            'X-Feature-Available': stats.isConfigured ? 'true' : 'false',
        },
    });
}

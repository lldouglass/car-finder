/**
 * VinAudit API Client
 *
 * Provides access to NMVTIS (National Motor Vehicle Title Information System) data
 * for title brand and odometer verification.
 *
 * API Documentation: https://www.vinaudit.com/vehicle-history-api
 */

import { z } from 'zod';

// API configuration
const VINAUDIT_API_BASE = 'https://api.vinaudit.com/v1';

// Zod schemas for response validation
const TitleRecordSchema = z.object({
    state: z.string().optional().default(''),
    date: z.string().optional().default(''),
    odometer: z.number().optional().default(0),
    titleType: z.string().optional().default(''),
});

const OdometerRecordSchema = z.object({
    date: z.string(),
    reading: z.number(),
    source: z.string().optional(),
});

const VinAuditResponseSchema = z.object({
    success: z.boolean(),
    vin: z.string().optional(),
    titles: z.array(TitleRecordSchema).optional().default([]),
    titleBrands: z.array(z.string()).optional().default([]),
    odometerRecords: z.array(OdometerRecordSchema).optional().default([]),
    odometerDiscrepancy: z.boolean().optional().default(false),
    theftRecord: z.boolean().optional().default(false),
    totalLoss: z.boolean().optional().default(false),
    error: z.string().optional(),
});

// Export types
export interface TitleRecord {
    state: string;
    date: string;
    odometer: number;
    titleType: string; // Clean, Salvage, Rebuilt, Flood, Junk, Lemon, etc.
}

export interface OdometerRecord {
    date: string;
    reading: number;
    source?: string;
}

export interface VehicleHistory {
    vin: string;
    titleRecords: TitleRecord[];
    titleBrands: string[]; // ['SALVAGE', 'FLOOD', etc.]
    odometerRecords: OdometerRecord[];
    odometerDiscrepancy: boolean;
    theftRecord: boolean;
    totalLoss: boolean;
    fetchedAt: Date;
}

export interface VehicleHistoryResult {
    success: boolean;
    data?: VehicleHistory;
    error?: string;
    cached?: boolean;
}

// Title brand severity classifications
export const CRITICAL_TITLE_BRANDS = [
    'SALVAGE',
    'SALVAGE TITLE',
    'REBUILT',
    'REBUILT TITLE',
    'FLOOD',
    'FLOOD DAMAGE',
    'FIRE',
    'FIRE DAMAGE',
    'JUNK',
    'JUNK TITLE',
];

export const HIGH_RISK_TITLE_BRANDS = [
    'LEMON',
    'LEMON LAW BUYBACK',
    'MANUFACTURER BUYBACK',
    'GREY MARKET',
    'ODOMETER ROLLBACK',
    'ODOMETER DISCREPANCY',
];

/**
 * Checks if the VinAudit API key is configured.
 */
export function isVinAuditConfigured(): boolean {
    return !!process.env.VINAUDIT_API_KEY;
}

/**
 * Fetches vehicle history from VinAudit API.
 *
 * @param vin - The 17-character VIN to look up
 * @returns Vehicle history data or error
 */
export async function getVehicleHistory(vin: string): Promise<VehicleHistoryResult> {
    const apiKey = process.env.VINAUDIT_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: 'VinAudit API key not configured',
        };
    }

    // Validate VIN format
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
        return {
            success: false,
            error: 'Invalid VIN format',
        };
    }

    try {
        const response = await fetch(
            `${VINAUDIT_API_BASE}/history?vin=${encodeURIComponent(vin)}&key=${encodeURIComponent(apiKey)}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            // Handle specific error codes
            if (response.status === 401) {
                return {
                    success: false,
                    error: 'Invalid API key',
                };
            }
            if (response.status === 429) {
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please try again later.',
                };
            }
            if (response.status === 404) {
                return {
                    success: false,
                    error: 'No history records found for this VIN',
                };
            }
            return {
                success: false,
                error: `API error: ${response.status}`,
            };
        }

        const rawData = await response.json();
        const parseResult = VinAuditResponseSchema.safeParse(rawData);

        if (!parseResult.success) {
            console.error('VinAudit response validation failed:', parseResult.error);
            return {
                success: false,
                error: 'Invalid response format from VinAudit',
            };
        }

        const data = parseResult.data;

        if (!data.success) {
            return {
                success: false,
                error: data.error || 'Unknown error from VinAudit',
            };
        }

        // Transform to our format
        const vehicleHistory: VehicleHistory = {
            vin: vin.toUpperCase(),
            titleRecords: data.titles.map(t => ({
                state: t.state,
                date: t.date,
                odometer: t.odometer,
                titleType: t.titleType,
            })),
            titleBrands: data.titleBrands.map(b => b.toUpperCase()),
            odometerRecords: data.odometerRecords.map(o => ({
                date: o.date,
                reading: o.reading,
                source: o.source,
            })),
            odometerDiscrepancy: data.odometerDiscrepancy,
            theftRecord: data.theftRecord,
            totalLoss: data.totalLoss,
            fetchedAt: new Date(),
        };

        return {
            success: true,
            data: vehicleHistory,
        };

    } catch (error) {
        console.error('Error fetching vehicle history:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Analyzes vehicle history and returns a severity assessment.
 */
export function analyzeHistorySeverity(history: VehicleHistory): {
    hasCriticalIssue: boolean;
    hasHighRiskIssue: boolean;
    issues: Array<{ type: string; severity: 'critical' | 'high' | 'medium'; description: string }>;
} {
    const issues: Array<{ type: string; severity: 'critical' | 'high' | 'medium'; description: string }> = [];

    // Check for critical title brands
    for (const brand of history.titleBrands) {
        const upperBrand = brand.toUpperCase();
        if (CRITICAL_TITLE_BRANDS.some(c => upperBrand.includes(c))) {
            issues.push({
                type: 'title_brand',
                severity: 'critical',
                description: `${brand} title brand detected`,
            });
        } else if (HIGH_RISK_TITLE_BRANDS.some(h => upperBrand.includes(h))) {
            issues.push({
                type: 'title_brand',
                severity: 'high',
                description: `${brand} title brand detected`,
            });
        }
    }

    // Check for odometer discrepancy
    if (history.odometerDiscrepancy) {
        issues.push({
            type: 'odometer',
            severity: 'critical',
            description: 'Odometer discrepancy detected - possible rollback or tampering',
        });
    }

    // Check for theft record
    if (history.theftRecord) {
        issues.push({
            type: 'theft',
            severity: 'critical',
            description: 'Vehicle has theft record',
        });
    }

    // Check for total loss
    if (history.totalLoss) {
        issues.push({
            type: 'total_loss',
            severity: 'high',
            description: 'Vehicle was declared a total loss by insurance',
        });
    }

    return {
        hasCriticalIssue: issues.some(i => i.severity === 'critical'),
        hasHighRiskIssue: issues.some(i => i.severity === 'high'),
        issues,
    };
}

/**
 * Calculates score penalty based on vehicle history issues.
 */
export function calculateHistoryPenalty(history: VehicleHistory): number {
    const analysis = analyzeHistorySeverity(history);
    let penalty = 0;

    for (const issue of analysis.issues) {
        switch (issue.severity) {
            case 'critical':
                // Critical issues like salvage/flood titles
                if (issue.type === 'title_brand') penalty += 3.0;
                else if (issue.type === 'odometer') penalty += 2.0;
                else if (issue.type === 'theft') penalty += 2.5;
                else penalty += 2.0;
                break;
            case 'high':
                // High-risk issues like total loss or lemon
                penalty += 1.5;
                break;
            case 'medium':
                penalty += 0.5;
                break;
        }
    }

    return penalty;
}

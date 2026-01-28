/**
 * External vehicle pricing API integration.
 *
 * Supports multiple pricing data providers:
 * 1. VehicleDatabases.com API (recommended) - Set VEHICLE_DATABASES_API_KEY
 * 2. RapidAPI Vehicle Market Value - Set RAPIDAPI_KEY
 *
 * Falls back to formula-based estimation if no API is configured or fails.
 *
 * Get API keys:
 * - VehicleDatabases: https://vehicledatabases.com/portal/signup (free trial)
 * - RapidAPI: https://rapidapi.com/dominonet-lTpEE6zONeS/api/vehicle-market-value
 */

import { PriceEstimate, estimateFairPrice as formulaEstimate } from './pricing';

export interface PriceEstimateWithSource extends PriceEstimate {
    source: 'api' | 'formula';
    apiProvider?: string;
    confidence?: 'high' | 'medium' | 'low';
    sampleSize?: number;
    apiError?: string;
    breakdown?: {
        tradeIn?: { low: number; high: number };
        privateParty?: { low: number; high: number };
        dealerRetail?: { low: number; high: number };
    };
    _debug?: {
        hasRapidApiKey: boolean;
        hasVehicleDbKey: boolean;
        vinProvided: boolean;
    };
}

// ============================================================
// VehicleDatabases.com API
// Docs: https://vehicledatabases.com/docs/api-documentation/market-value/
// ============================================================

interface VehicleDatabasesResponse {
    status: 'success' | 'error';
    message?: string;
    data?: {
        basic?: {
            make: string;
            model: string;
            year: string;
            trim: string;
            state?: string;
            mileage?: string;
        };
        market_value?: {
            market_value_data?: Array<{
                trim: string;
                'market value'?: Array<{
                    Condition: string;
                    'Trade-In': string;
                    'Private Party': string;
                    'Dealer Retail': string;
                }>;
            }>;
        };
    };
}

function parseCurrency(value: string | undefined): number | null {
    if (!value) return null;
    const cleaned = value.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

async function fetchFromVehicleDatabases(
    vin: string,
    mileage?: number,
    state?: string
): Promise<PriceEstimateWithSource | null> {
    const apiKey = process.env.VEHICLE_DATABASES_API_KEY;
    if (!apiKey) return null;

    try {
        const url = new URL(`https://api.vehicledatabases.com/market-value/v2/${vin}`);
        if (mileage) url.searchParams.set('mileage', mileage.toString());
        if (state) url.searchParams.set('state', state);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'x-AuthKey': apiKey,
            },
        });

        if (!response.ok) {
            console.error(`VehicleDatabases API error: ${response.status}`);
            return null;
        }

        const data: VehicleDatabasesResponse = await response.json();

        if (data.status !== 'success' || !data.data?.market_value?.market_value_data) {
            return null;
        }

        // Extract values - typically want "Average" or "Clean" condition for fair price
        const marketValueData = data.data.market_value.market_value_data[0]?.['market value'];
        if (!marketValueData || marketValueData.length === 0) {
            return null;
        }

        // Find "Average" or "Clean" condition, fall back to first
        const avgCondition = marketValueData.find(v =>
            v.Condition.toLowerCase().includes('average') ||
            v.Condition.toLowerCase().includes('clean')
        ) || marketValueData[0];

        const privateParty = parseCurrency(avgCondition['Private Party']);
        const dealerRetail = parseCurrency(avgCondition['Dealer Retail']);
        const tradeIn = parseCurrency(avgCondition['Trade-In']);

        if (!privateParty && !dealerRetail) {
            return null;
        }

        // For "fair price" use private party as midpoint (what most people pay)
        // Low = trade-in value, High = dealer retail
        const midpoint = privateParty || dealerRetail!;
        const low = tradeIn || Math.round(midpoint * 0.85);
        const high = dealerRetail || Math.round(midpoint * 1.15);

        // Build breakdown from all conditions
        const breakdown: PriceEstimateWithSource['breakdown'] = {};
        for (const condition of marketValueData) {
            const ti = parseCurrency(condition['Trade-In']);
            const pp = parseCurrency(condition['Private Party']);
            const dr = parseCurrency(condition['Dealer Retail']);

            if (condition.Condition.toLowerCase().includes('average') ||
                condition.Condition.toLowerCase().includes('clean')) {
                if (ti) breakdown.tradeIn = { low: ti, high: ti };
                if (pp) breakdown.privateParty = { low: pp, high: pp };
                if (dr) breakdown.dealerRetail = { low: dr, high: dr };
            }
        }

        return {
            low: Math.max(500, low),
            high: Math.max(1000, high),
            midpoint: Math.round(midpoint),
            source: 'api',
            apiProvider: 'VehicleDatabases',
            confidence: 'high',
            breakdown,
        };
    } catch (error) {
        console.error('VehicleDatabases API error:', error);
        return null;
    }
}

// ============================================================
// RapidAPI Vehicle Market Value
// Docs: https://rapidapi.com/dominonet-lTpEE6zONeS/api/vehicle-market-value
// ============================================================

interface RapidAPIResponse {
    status: 'SUCCESS' | 'FAIL' | string;
    message?: string;
    error?: string;
    vehicle?: string;
    mileage?: number;
    average_market_price?: number;
    standard_deviation?: number;
    count?: number;
    statistical_confidence?: string;
    market_prices?: {
        below: number;
        average: number;
        above: number;
        distribution?: Array<{
            group: { count: number; min: number; max: number };
        }>;
    };
    sales_period?: [string, string];
    adjustments?: {
        mileage?: { adjustment: number; average: number; input: number };
        condition?: { adjustment: number; input: string | null };
    };
}

async function fetchFromRapidAPI(
    vin: string,
    mileage: number
): Promise<PriceEstimateWithSource | null> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
        console.log('[RapidAPI] No API key');
        return null;
    }

    try {
        const url = new URL('https://vehicle-market-value.p.rapidapi.com/vmv');
        url.searchParams.set('vin', vin);
        url.searchParams.set('mileage', mileage.toString());

        console.log('[RapidAPI] Fetching:', url.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'vehicle-market-value.p.rapidapi.com',
            },
        });

        console.log('[RapidAPI] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[RapidAPI] Error: ${response.status} - ${errorText}`);
            return null;
        }

        const data: RapidAPIResponse = await response.json();
        console.log('[RapidAPI] Response data status:', data.status);
        console.log('[RapidAPI] Average price:', data.average_market_price);

        // Check for error status
        if (data.status !== 'SUCCESS') {
            console.error('[RapidAPI] Non-success status:', data.message || data.error || data.status);
            return null;
        }

        if (!data.average_market_price && !data.market_prices?.average) {
            return null;
        }

        const average = data.average_market_price || data.market_prices!.average;
        const low = data.market_prices?.below || Math.round(average * 0.85);
        const high = data.market_prices?.above || Math.round(average * 1.15);

        // Parse confidence from string like "94%"
        let confidence: 'high' | 'medium' | 'low' = 'medium';
        if (data.statistical_confidence) {
            const pct = parseInt(data.statistical_confidence);
            if (pct >= 90) confidence = 'high';
            else if (pct >= 70) confidence = 'medium';
            else confidence = 'low';
        } else if (data.count) {
            if (data.count >= 50) confidence = 'high';
            else if (data.count >= 10) confidence = 'medium';
            else confidence = 'low';
        }

        return {
            low: Math.max(500, Math.round(low)),
            high: Math.max(1000, Math.round(high)),
            midpoint: Math.round(average),
            source: 'api',
            apiProvider: 'RapidAPI',
            confidence,
            sampleSize: data.count,
        };
    } catch (error) {
        console.error('RapidAPI fetch error:', error);
        return null;
    }
}

// ============================================================
// Main Export
// ============================================================

/**
 * Get fair price estimate with API support
 *
 * Tries external APIs first (VehicleDatabases, then RapidAPI),
 * falls back to formula if unavailable.
 */
export async function estimateFairPriceWithApi(
    make: string,
    model: string,
    year: number,
    mileage: number,
    vin?: string,
    state?: string
): Promise<PriceEstimateWithSource> {
    // Debug logging
    console.log('[Pricing API] Checking env vars:', {
        hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
        hasVehicleDbKey: !!process.env.VEHICLE_DATABASES_API_KEY,
        vin: vin ? `${vin.substring(0, 4)}...` : 'none',
    });

    // Try VehicleDatabases first (better data, clearer pricing)
    if (process.env.VEHICLE_DATABASES_API_KEY && vin && vin.length === 17) {
        console.log('[Pricing API] Trying VehicleDatabases...');
        const result = await fetchFromVehicleDatabases(vin, mileage, state);
        if (result) return result;
    }

    // Try RapidAPI second
    if (process.env.RAPIDAPI_KEY && vin && vin.length === 17) {
        console.log('[Pricing API] Trying RapidAPI...');
        const result = await fetchFromRapidAPI(vin, mileage);
        if (result) {
            console.log('[Pricing API] RapidAPI success:', result.midpoint);
            return result;
        }
        console.log('[Pricing API] RapidAPI returned null');
    }

    // Fall back to formula-based estimation
    const formulaResult = formulaEstimate(make, model, year, mileage);

    let apiError = 'No API key configured';
    if (process.env.VEHICLE_DATABASES_API_KEY || process.env.RAPIDAPI_KEY) {
        apiError = vin ? 'API returned no data for this VIN' : 'VIN required for API lookup';
    }

    return {
        ...formulaResult,
        source: 'formula',
        confidence: 'low',
        apiError,
        _debug: {
            hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
            hasVehicleDbKey: !!process.env.VEHICLE_DATABASES_API_KEY,
            vinProvided: !!vin,
        },
    };
}

/**
 * Check if any pricing API is configured
 */
export function isPricingApiConfigured(): boolean {
    return !!(process.env.VEHICLE_DATABASES_API_KEY || process.env.RAPIDAPI_KEY);
}

/**
 * Get which pricing API is configured
 */
export function getConfiguredPricingApi(): string | null {
    if (process.env.VEHICLE_DATABASES_API_KEY) return 'VehicleDatabases';
    if (process.env.RAPIDAPI_KEY) return 'RapidAPI';
    return null;
}

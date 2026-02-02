/**
 * Regional Pricing Adjustments Module
 *
 * Provides regional price multipliers based on geographic location.
 * Regions are based on economic and climate factors that affect vehicle prices.
 */

export type Region =
    | 'pacific'
    | 'mountain'
    | 'midwest'
    | 'south_central'
    | 'southeast'
    | 'northeast'
    | 'unknown';

export interface RegionalAdjustment {
    region: Region;
    regionName: string;
    baseMultiplier: number;
    vehicleTypeAdjustment: number;
    totalMultiplier: number;
    explanation: string;
}

// State to region mapping
const STATE_TO_REGION: Record<string, Region> = {
    // Pacific
    'CA': 'pacific',
    'OR': 'pacific',
    'WA': 'pacific',
    'HI': 'pacific',
    'AK': 'pacific',
    'california': 'pacific',
    'oregon': 'pacific',
    'washington': 'pacific',
    'hawaii': 'pacific',
    'alaska': 'pacific',

    // Mountain
    'NV': 'mountain',
    'AZ': 'mountain',
    'UT': 'mountain',
    'CO': 'mountain',
    'NM': 'mountain',
    'ID': 'mountain',
    'MT': 'mountain',
    'WY': 'mountain',
    'nevada': 'mountain',
    'arizona': 'mountain',
    'utah': 'mountain',
    'colorado': 'mountain',
    'new mexico': 'mountain',
    'idaho': 'mountain',
    'montana': 'mountain',
    'wyoming': 'mountain',

    // Midwest
    'IL': 'midwest',
    'IN': 'midwest',
    'MI': 'midwest',
    'OH': 'midwest',
    'WI': 'midwest',
    'MN': 'midwest',
    'IA': 'midwest',
    'MO': 'midwest',
    'KS': 'midwest',
    'NE': 'midwest',
    'ND': 'midwest',
    'SD': 'midwest',
    'illinois': 'midwest',
    'indiana': 'midwest',
    'michigan': 'midwest',
    'ohio': 'midwest',
    'wisconsin': 'midwest',
    'minnesota': 'midwest',
    'iowa': 'midwest',
    'missouri': 'midwest',
    'kansas': 'midwest',
    'nebraska': 'midwest',
    'north dakota': 'midwest',
    'south dakota': 'midwest',

    // South Central
    'TX': 'south_central',
    'OK': 'south_central',
    'AR': 'south_central',
    'LA': 'south_central',
    'texas': 'south_central',
    'oklahoma': 'south_central',
    'arkansas': 'south_central',
    'louisiana': 'south_central',

    // Southeast
    'FL': 'southeast',
    'GA': 'southeast',
    'AL': 'southeast',
    'MS': 'southeast',
    'TN': 'southeast',
    'KY': 'southeast',
    'SC': 'southeast',
    'NC': 'southeast',
    'VA': 'southeast',
    'WV': 'southeast',
    'florida': 'southeast',
    'georgia': 'southeast',
    'alabama': 'southeast',
    'mississippi': 'southeast',
    'tennessee': 'southeast',
    'kentucky': 'southeast',
    'south carolina': 'southeast',
    'north carolina': 'southeast',
    'virginia': 'southeast',
    'west virginia': 'southeast',

    // Northeast
    'NY': 'northeast',
    'NJ': 'northeast',
    'PA': 'northeast',
    'CT': 'northeast',
    'MA': 'northeast',
    'RI': 'northeast',
    'NH': 'northeast',
    'VT': 'northeast',
    'ME': 'northeast',
    'DE': 'northeast',
    'MD': 'northeast',
    'DC': 'northeast',
    'new york': 'northeast',
    'new jersey': 'northeast',
    'pennsylvania': 'northeast',
    'connecticut': 'northeast',
    'massachusetts': 'northeast',
    'rhode island': 'northeast',
    'new hampshire': 'northeast',
    'vermont': 'northeast',
    'maine': 'northeast',
    'delaware': 'northeast',
    'maryland': 'northeast',
    'district of columbia': 'northeast',
    'washington dc': 'northeast',
    'washington d.c.': 'northeast',
};

// Region names for display
const REGION_NAMES: Record<Region, string> = {
    pacific: 'Pacific (CA, OR, WA, HI, AK)',
    mountain: 'Mountain (NV, AZ, UT, CO, NM, ID, MT, WY)',
    midwest: 'Midwest (IL, IN, MI, OH, WI, MN, IA, MO, KS, NE, ND, SD)',
    south_central: 'South Central (TX, OK, AR, LA)',
    southeast: 'Southeast (FL, GA, AL, MS, TN, KY, SC, NC, VA, WV)',
    northeast: 'Northeast (NY, NJ, PA, CT, MA, RI, NH, VT, ME, DE, MD, DC)',
    unknown: 'Unknown Region',
};

// Base regional multipliers
// Based on BLS cost of living data and regional vehicle demand
const REGIONAL_BASE_MULTIPLIERS: Record<Region, number> = {
    pacific: 1.08,        // High cost of living, emissions standards
    mountain: 1.02,       // Growing markets
    midwest: 0.95,        // Lower demand, rust concerns
    south_central: 1.00,  // Baseline (large volume market)
    southeast: 0.98,      // Moderate demand
    northeast: 1.05,      // Higher costs, salt/rust concerns
    unknown: 1.00,        // Default to baseline
};

// Regional explanations
const REGIONAL_EXPLANATIONS: Record<Region, string> = {
    pacific: 'Higher prices due to strict emissions standards and high cost of living',
    mountain: 'Slightly elevated prices in growing markets with outdoor vehicle demand',
    midwest: 'Lower prices due to rust belt concerns and moderate demand',
    south_central: 'Baseline pricing - large volume market with diverse inventory',
    southeast: 'Slightly lower prices with moderate demand and warm climate',
    northeast: 'Higher prices due to cost of living and salt-related depreciation concerns',
    unknown: 'Using national average pricing - location not specified',
};

export type VehicleType = 'truck' | 'suv' | 'ev' | 'awd' | 'convertible' | 'sedan' | 'other';

/**
 * Vehicle type adjustments by region
 * These stack with the base regional multiplier
 */
const VEHICLE_TYPE_REGIONAL_ADJUSTMENTS: Record<Region, Partial<Record<VehicleType, number>>> = {
    pacific: {
        ev: 0.05,           // +5% EV demand (charging infrastructure)
        convertible: 0.03,  // +3% convertible demand
    },
    mountain: {
        truck: 0.05,        // +5% truck demand (rural/outdoor)
        suv: 0.03,          // +3% SUV demand
        awd: 0.05,          // +5% AWD demand (snow)
    },
    midwest: {
        truck: 0.05,        // +5% truck demand (rural)
        ev: -0.05,          // -5% EV (less infrastructure)
        convertible: -0.03, // -3% convertible (weather)
    },
    south_central: {
        truck: 0.05,        // +5% truck demand
    },
    southeast: {
        convertible: 0.03,  // +3% convertible demand
        ev: -0.03,          // -3% EV (less infrastructure)
    },
    northeast: {
        awd: 0.05,          // +5% AWD demand (snow)
        ev: 0.02,           // +2% EV (urban areas)
        convertible: -0.05, // -5% convertible (weather)
    },
    unknown: {},
};

/**
 * Determines the region from a state code or name
 */
export function getRegionFromState(state: string | undefined): Region {
    if (!state) return 'unknown';

    const normalized = state.trim().toUpperCase();
    const normalizedLower = state.trim().toLowerCase();

    // Try uppercase (state codes)
    if (STATE_TO_REGION[normalized]) {
        return STATE_TO_REGION[normalized];
    }

    // Try lowercase (full names)
    if (STATE_TO_REGION[normalizedLower]) {
        return STATE_TO_REGION[normalizedLower];
    }

    return 'unknown';
}

/**
 * Determines vehicle type for regional adjustment
 */
export function determineVehicleType(
    bodyClass: string | undefined,
    fuelType: string | undefined,
    driveType: string | undefined
): VehicleType {
    const body = (bodyClass || '').toLowerCase();
    const fuel = (fuelType || '').toLowerCase();
    const drive = (driveType || '').toLowerCase();

    // Check EV first (highest priority)
    if (fuel.includes('electric') && !fuel.includes('hybrid')) {
        return 'ev';
    }

    // Check body type
    if (body.includes('pickup') || body.includes('truck')) {
        return 'truck';
    }

    if (body.includes('suv') || body.includes('sport utility')) {
        return 'suv';
    }

    if (body.includes('convertible') || body.includes('roadster')) {
        return 'convertible';
    }

    // Check drivetrain
    if (drive.includes('awd') || drive.includes('all wheel') || drive.includes('4wd') || drive.includes('4x4')) {
        return 'awd';
    }

    if (body.includes('sedan')) {
        return 'sedan';
    }

    return 'other';
}

/**
 * Gets vehicle type adjustment for a specific region
 */
export function getVehicleTypeAdjustment(region: Region, vehicleType: VehicleType): number {
    const adjustments = VEHICLE_TYPE_REGIONAL_ADJUSTMENTS[region];
    return adjustments[vehicleType] || 0;
}

/**
 * Calculates regional pricing adjustment
 */
export function calculateRegionalAdjustment(
    state: string | undefined,
    bodyClass: string | undefined,
    fuelType: string | undefined,
    driveType: string | undefined
): RegionalAdjustment {
    const region = getRegionFromState(state);
    const vehicleType = determineVehicleType(bodyClass, fuelType, driveType);

    const baseMultiplier = REGIONAL_BASE_MULTIPLIERS[region];
    const vehicleTypeAdjustment = getVehicleTypeAdjustment(region, vehicleType);
    const totalMultiplier = baseMultiplier + vehicleTypeAdjustment;

    let explanation = REGIONAL_EXPLANATIONS[region];
    if (vehicleTypeAdjustment !== 0) {
        const direction = vehicleTypeAdjustment > 0 ? 'higher' : 'lower';
        const typeLabel = vehicleType === 'ev' ? 'Electric vehicles' :
            vehicleType === 'truck' ? 'Trucks' :
            vehicleType === 'suv' ? 'SUVs' :
            vehicleType === 'awd' ? 'AWD vehicles' :
            vehicleType === 'convertible' ? 'Convertibles' : 'This vehicle type';
        explanation += `. ${typeLabel} tend to be ${direction} priced in this region.`;
    }

    return {
        region,
        regionName: REGION_NAMES[region],
        baseMultiplier,
        vehicleTypeAdjustment,
        totalMultiplier,
        explanation,
    };
}

/**
 * Applies regional adjustment to a price
 */
export function applyRegionalAdjustment(price: number, adjustment: RegionalAdjustment): number {
    return Math.round(price * adjustment.totalMultiplier);
}

/**
 * Gets all available regions for display
 */
export function getAllRegions(): { region: Region; name: string; multiplier: number }[] {
    return (Object.keys(REGIONAL_BASE_MULTIPLIERS) as Region[])
        .filter(r => r !== 'unknown')
        .map(region => ({
            region,
            name: REGION_NAMES[region],
            multiplier: REGIONAL_BASE_MULTIPLIERS[region],
        }));
}

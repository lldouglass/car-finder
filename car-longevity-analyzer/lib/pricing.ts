/**
 * Vehicle pricing estimation utilities.
 * Uses realistic depreciation curves based on industry data.
 */

export interface PriceEstimate {
    low: number;
    high: number;
    midpoint: number;
}

export interface MsrpData {
    baseMsrp: number;
    category: 'economy' | 'midsize' | 'luxury' | 'truck' | 'suv';
}

/**
 * MSRP database with vehicle categories for better depreciation modeling.
 * In production, this would be replaced with a pricing API (KBB, Edmunds, etc.)
 */
const MSRP_DATABASE: Record<string, MsrpData> = {
    // Toyota
    'toyota camry': { baseMsrp: 28000, category: 'midsize' },
    'toyota corolla': { baseMsrp: 22000, category: 'economy' },
    'toyota rav4': { baseMsrp: 30000, category: 'suv' },
    'toyota highlander': { baseMsrp: 40000, category: 'suv' },
    'toyota tacoma': { baseMsrp: 35000, category: 'truck' },
    'toyota tundra': { baseMsrp: 45000, category: 'truck' },
    'toyota prius': { baseMsrp: 28000, category: 'economy' },

    // Honda
    'honda civic': { baseMsrp: 24000, category: 'economy' },
    'honda accord': { baseMsrp: 29000, category: 'midsize' },
    'honda cr-v': { baseMsrp: 32000, category: 'suv' },
    'honda pilot': { baseMsrp: 40000, category: 'suv' },
    'honda hr-v': { baseMsrp: 26000, category: 'suv' },

    // Subaru
    'subaru outback': { baseMsrp: 32000, category: 'suv' },
    'subaru forester': { baseMsrp: 30000, category: 'suv' },
    'subaru crosstrek': { baseMsrp: 28000, category: 'suv' },
    'subaru impreza': { baseMsrp: 24000, category: 'economy' },

    // Mazda
    'mazda mazda3': { baseMsrp: 24000, category: 'economy' },
    'mazda 3': { baseMsrp: 24000, category: 'economy' },
    'mazda mazda6': { baseMsrp: 28000, category: 'midsize' },
    'mazda 6': { baseMsrp: 28000, category: 'midsize' },
    'mazda cx-5': { baseMsrp: 30000, category: 'suv' },
    'mazda cx-30': { baseMsrp: 28000, category: 'suv' },

    // Hyundai
    'hyundai sonata': { baseMsrp: 27000, category: 'midsize' },
    'hyundai elantra': { baseMsrp: 22000, category: 'economy' },
    'hyundai tucson': { baseMsrp: 30000, category: 'suv' },
    'hyundai santa fe': { baseMsrp: 35000, category: 'suv' },

    // Ford
    'ford f-150': { baseMsrp: 45000, category: 'truck' },
    'ford escape': { baseMsrp: 30000, category: 'suv' },
    'ford fusion': { baseMsrp: 26000, category: 'midsize' },
    'ford mustang': { baseMsrp: 35000, category: 'midsize' },
    'ford explorer': { baseMsrp: 40000, category: 'suv' },

    // Chevrolet
    'chevrolet silverado': { baseMsrp: 45000, category: 'truck' },
    'chevrolet equinox': { baseMsrp: 30000, category: 'suv' },
    'chevrolet malibu': { baseMsrp: 26000, category: 'midsize' },
    'chevrolet traverse': { baseMsrp: 38000, category: 'suv' },

    // Nissan
    'nissan altima': { baseMsrp: 27000, category: 'midsize' },
    'nissan rogue': { baseMsrp: 30000, category: 'suv' },
    'nissan sentra': { baseMsrp: 22000, category: 'economy' },
    'nissan pathfinder': { baseMsrp: 38000, category: 'suv' },

    // Luxury brands (higher MSRP, different depreciation)
    'bmw 3 series': { baseMsrp: 45000, category: 'luxury' },
    'bmw 5 series': { baseMsrp: 58000, category: 'luxury' },
    'bmw x3': { baseMsrp: 48000, category: 'luxury' },
    'bmw x5': { baseMsrp: 65000, category: 'luxury' },
    'mercedes c-class': { baseMsrp: 48000, category: 'luxury' },
    'mercedes e-class': { baseMsrp: 60000, category: 'luxury' },
    'audi a4': { baseMsrp: 45000, category: 'luxury' },
    'audi q5': { baseMsrp: 50000, category: 'luxury' },
    'lexus es': { baseMsrp: 45000, category: 'luxury' },
    'lexus rx': { baseMsrp: 52000, category: 'luxury' },
};

/**
 * Category-specific depreciation rates (annual retention percentage).
 * Based on industry depreciation studies.
 */
const DEPRECIATION_CURVES: Record<MsrpData['category'], number[]> = {
    // [year1, year2, year3, year4, year5, year6+]
    // Values represent percentage of previous year's value retained
    economy: [0.82, 0.88, 0.90, 0.92, 0.94, 0.95],   // Economy cars hold value decently
    midsize: [0.80, 0.87, 0.89, 0.91, 0.93, 0.95],   // Midsize sedans
    suv: [0.78, 0.86, 0.88, 0.90, 0.93, 0.95],       // SUVs - popular, hold value well
    truck: [0.75, 0.85, 0.88, 0.91, 0.94, 0.96],     // Trucks - strong resale
    luxury: [0.72, 0.82, 0.85, 0.88, 0.90, 0.92],    // Luxury - faster initial depreciation
};

/**
 * Minimum value floor as percentage of MSRP by category.
 * Cars don't depreciate to zero - there's always some base value.
 */
const VALUE_FLOORS: Record<MsrpData['category'], number> = {
    economy: 0.15,  // 15% minimum
    midsize: 0.12,
    suv: 0.18,      // SUVs hold value better
    truck: 0.20,    // Trucks hold value best
    luxury: 0.10,   // Luxury has lowest floor
};

/**
 * Brand-specific value retention multipliers.
 * Some brands hold value significantly better than others.
 * Based on industry resale value studies.
 */
const BRAND_RETENTION_MULTIPLIERS: Record<string, number> = {
    // Premium retention (hold value very well)
    'toyota': 1.18,
    'lexus': 1.15,
    'honda': 1.15,
    'subaru': 1.12,
    'mazda': 1.10,
    'porsche': 1.20,

    // Above average retention
    'hyundai': 1.05,
    'kia': 1.05,
    'acura': 1.05,

    // Average retention (1.0 baseline)
    'ford': 1.00,
    'chevrolet': 1.00,
    'gmc': 1.02,
    'ram': 1.02,

    // Below average retention
    'nissan': 0.95,
    'volkswagen': 0.95,
    'dodge': 0.95,
    'jeep': 0.98,
    'chrysler': 0.90,

    // Luxury with faster depreciation
    'bmw': 0.92,
    'mercedes': 0.90,
    'mercedes-benz': 0.90,
    'audi': 0.92,
    'infiniti': 0.88,
    'cadillac': 0.85,
    'lincoln': 0.85,
    'jaguar': 0.82,
    'land rover': 0.85,
};

/**
 * Look up MSRP data for a vehicle.
 */
export function getMsrpData(make: string, model: string): MsrpData {
    const key = `${make.toLowerCase()} ${model.toLowerCase()}`;

    // Direct match
    if (MSRP_DATABASE[key]) {
        return MSRP_DATABASE[key];
    }

    // Partial match (handles trim levels like "Civic EX")
    for (const [dbKey, data] of Object.entries(MSRP_DATABASE)) {
        if (key.includes(dbKey) || dbKey.includes(key.split(' ').slice(0, 2).join(' '))) {
            return data;
        }
    }

    // Default fallback
    return { baseMsrp: 30000, category: 'midsize' };
}

/**
 * Calculate depreciation using realistic curves.
 * Returns the retention percentage (0-1) of original value.
 */
function calculateDepreciation(age: number, category: MsrpData['category']): number {
    const curve = DEPRECIATION_CURVES[category];
    let retention = 1.0;

    for (let year = 0; year < age; year++) {
        const rateIndex = Math.min(year, curve.length - 1);
        retention *= curve[rateIndex];
    }

    // Apply floor
    const floor = VALUE_FLOORS[category];
    return Math.max(retention, floor);
}

/**
 * Calculate mileage adjustment factor.
 * High mileage reduces value, low mileage increases it.
 */
function calculateMileageAdjustment(mileage: number, age: number): number {
    const avgMilesPerYear = 12000;
    const expectedMiles = age * avgMilesPerYear;
    const mileageDiff = mileage - expectedMiles;

    // +/- 2% per 10,000 miles difference, capped at +/- 15%
    const adjustment = (mileageDiff / 10000) * -0.02;
    return Math.max(-0.15, Math.min(0.15, adjustment));
}

/**
 * Get brand retention multiplier.
 */
function getBrandRetentionMultiplier(make: string): number {
    const normalizedMake = make.toLowerCase().trim();
    return BRAND_RETENTION_MULTIPLIERS[normalizedMake] ?? 1.0;
}

/**
 * Estimate fair market price for a vehicle.
 */
export function estimateFairPrice(
    make: string,
    model: string,
    year: number,
    mileage: number
): PriceEstimate {
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - year);

    const msrpData = getMsrpData(make, model);
    const baseMsrp = msrpData.baseMsrp;

    // Calculate base depreciated value
    const depreciationRetention = calculateDepreciation(age, msrpData.category);
    let baseValue = baseMsrp * depreciationRetention;

    // Apply brand-specific retention adjustment
    const brandMultiplier = getBrandRetentionMultiplier(make);
    baseValue = baseValue * brandMultiplier;

    // Apply mileage adjustment
    const mileageAdj = calculateMileageAdjustment(mileage, age);
    baseValue = baseValue * (1 + mileageAdj);

    // Calculate range (typically +/- 10-12% for private sales)
    const variance = 0.11;
    const midpoint = Math.round(baseValue);
    const low = Math.round(baseValue * (1 - variance));
    const high = Math.round(baseValue * (1 + variance));

    // Ensure minimum values make sense
    const absoluteMin = 2000;
    return {
        low: Math.max(absoluteMin, low),
        high: Math.max(absoluteMin + 500, high),
        midpoint: Math.max(absoluteMin + 250, midpoint),
    };
}

/**
 * Get approximate MSRP (convenience function for backward compatibility).
 */
export function getApproximateMsrp(make: string, model: string): number {
    return getMsrpData(make, model).baseMsrp;
}

/**
 * Dynamic MSRP Estimation Module
 *
 * Estimates vehicle MSRP based on VIN-decoded attributes when exact MSRP is unavailable.
 * Uses body class, engine size, drivetrain, and brand tier to calculate estimates.
 */

export type VehicleCategory =
    | 'compact'
    | 'sedan'
    | 'midsize_sedan'
    | 'fullsize_sedan'
    | 'compact_suv'
    | 'midsize_suv'
    | 'fullsize_suv'
    | 'pickup'
    | 'minivan'
    | 'sports'
    | 'luxury_sedan'
    | 'luxury_suv'
    | 'unknown';

export type DepreciationCategory = 'economy' | 'mainstream' | 'truck_suv' | 'luxury';

export interface MsrpEstimate {
    estimatedMsrp: number;
    category: VehicleCategory;
    depreciationCategory: DepreciationCategory;
    confidence: 'high' | 'medium' | 'low';
    source: 'database' | 'estimated';
    factors: {
        baseCategory: number;
        engineMultiplier: number;
        drivetrainMultiplier: number;
        brandMultiplier: number;
        inflationAdjustment: number;
    };
}

export interface VinAttributes {
    bodyClass?: string;
    displacementL?: number;
    fuelType?: string;
    driveType?: string;
    make: string;
    year: number;
}

// Base MSRP values by category (2024 dollars)
const CATEGORY_BASE_MSRP: Record<VehicleCategory, number> = {
    compact: 24000,
    sedan: 28000,
    midsize_sedan: 32000,
    fullsize_sedan: 38000,
    compact_suv: 32000,
    midsize_suv: 42000,
    fullsize_suv: 55000,
    pickup: 45000,
    minivan: 38000,
    sports: 45000,
    luxury_sedan: 55000,
    luxury_suv: 65000,
    unknown: 30000,
};

// Map categories to depreciation categories
const CATEGORY_TO_DEPRECIATION: Record<VehicleCategory, DepreciationCategory> = {
    compact: 'economy',
    sedan: 'mainstream',
    midsize_sedan: 'mainstream',
    fullsize_sedan: 'mainstream',
    compact_suv: 'mainstream',
    midsize_suv: 'truck_suv',
    fullsize_suv: 'truck_suv',
    pickup: 'truck_suv',
    minivan: 'mainstream',
    sports: 'mainstream',
    luxury_sedan: 'luxury',
    luxury_suv: 'luxury',
    unknown: 'mainstream',
};

// Engine displacement multipliers
const ENGINE_MULTIPLIERS: { maxDisplacement: number; multiplier: number }[] = [
    { maxDisplacement: 1.5, multiplier: 0.85 },
    { maxDisplacement: 2.0, multiplier: 0.95 },
    { maxDisplacement: 2.5, multiplier: 1.00 },
    { maxDisplacement: 3.0, multiplier: 1.10 },
    { maxDisplacement: 4.0, multiplier: 1.20 },
    { maxDisplacement: 5.0, multiplier: 1.35 },
    { maxDisplacement: Infinity, multiplier: 1.50 },
];

// Electric vehicle engine multiplier
const EV_ENGINE_MULTIPLIER = 1.25;

// Drivetrain multipliers
const DRIVETRAIN_MULTIPLIERS: Record<string, number> = {
    'fwd': 1.00,
    'front wheel drive': 1.00,
    'front-wheel drive': 1.00,
    'rwd': 1.05,
    'rear wheel drive': 1.05,
    'rear-wheel drive': 1.05,
    'awd': 1.15,
    'all wheel drive': 1.15,
    'all-wheel drive': 1.15,
    '4wd': 1.18,
    '4x4': 1.18,
    'four wheel drive': 1.18,
    '4-wheel drive': 1.18,
};

/**
 * Brand resale multipliers based on 5-year retention data
 * Sources: CarEdge, iSeeCars
 *
 * These affect the starting MSRP estimate - brands with better resale
 * typically have higher transaction prices even at similar MSRPs.
 */
const BRAND_RESALE_MULTIPLIERS: Record<string, number> = {
    // Premium (excellent reliability, high demand)
    'toyota': 1.19,
    'lexus': 1.13,
    'subaru': 1.12,
    'honda': 1.11,
    'mazda': 1.10,
    'porsche': 1.10,

    // Above average
    'ram': 1.09,
    'acura': 1.07,
    'gmc': 1.04,

    // Average
    'mercedes-benz': 0.99,
    'mercedes': 0.99,
    'audi': 0.96,
    'hyundai': 0.95,
    'chevrolet': 0.95,
    'kia': 0.94,
    'volkswagen': 0.94,

    // Below average
    'genesis': 0.92,
    'bmw': 0.92,
    'ford': 0.92,
    'nissan': 0.91,
    'buick': 0.91,
    'jeep': 0.91,

    // Poor retention
    'mitsubishi': 0.89,
    'infiniti': 0.86,
    'tesla': 0.83,
    'land rover': 0.77,
    'chrysler': 0.71,
    'dodge': 0.70,
    'jaguar': 0.70,
    'cadillac': 0.75,
    'lincoln': 0.75,
    'volvo': 0.85,
    'rivian': 0.80,
    'lucid': 0.75,
    'polestar': 0.78,
};

// Special case: Jeep Wrangler holds value exceptionally well
const JEEP_WRANGLER_MULTIPLIER = 1.05;

// Luxury brands for category detection
const LUXURY_BRANDS = new Set([
    'lexus', 'bmw', 'mercedes-benz', 'mercedes', 'audi', 'porsche',
    'jaguar', 'land rover', 'cadillac', 'lincoln', 'infiniti',
    'genesis', 'maserati', 'bentley', 'rolls-royce', 'ferrari',
    'lamborghini', 'aston martin', 'alfa romeo', 'volvo', 'acura',
]);

// Annual inflation rate for adjusting historical MSRPs
const ANNUAL_INFLATION = 0.03;
const REFERENCE_YEAR = new Date().getFullYear();

/**
 * Maps NHTSA body class to our vehicle category
 */
export function mapBodyClassToCategory(bodyClass: string | undefined, make: string): VehicleCategory {
    if (!bodyClass) return 'unknown';

    const body = bodyClass.toLowerCase();
    const makeLower = make.toLowerCase();
    const isLuxury = LUXURY_BRANDS.has(makeLower);

    // Pickup trucks
    if (body.includes('pickup') || body.includes('truck')) {
        return 'pickup';
    }

    // Minivan/Van
    if (body.includes('minivan') || body.includes('van')) {
        return 'minivan';
    }

    // SUVs and Crossovers
    if (body.includes('suv') || body.includes('sport utility') || body.includes('crossover')) {
        if (isLuxury) return 'luxury_suv';
        if (body.includes('compact') || body.includes('small')) return 'compact_suv';
        if (body.includes('full') || body.includes('large')) return 'fullsize_suv';
        return 'midsize_suv';
    }

    // Sports cars
    if (body.includes('convertible') || body.includes('roadster') || body.includes('coupe')) {
        if (isLuxury) return 'sports';
        return 'sports';
    }

    // Hatchbacks
    if (body.includes('hatchback')) {
        return 'compact';
    }

    // Wagons
    if (body.includes('wagon')) {
        return isLuxury ? 'luxury_sedan' : 'midsize_sedan';
    }

    // Sedans
    if (body.includes('sedan')) {
        if (isLuxury) return 'luxury_sedan';
        if (body.includes('compact') || body.includes('subcompact') || body.includes('small')) {
            return 'compact';
        }
        if (body.includes('full') || body.includes('large')) return 'fullsize_sedan';
        if (body.includes('mid')) return 'midsize_sedan';
        return 'sedan';
    }

    // Default based on brand
    if (isLuxury) return 'luxury_sedan';
    return 'unknown';
}

/**
 * Gets engine size multiplier
 */
export function getEngineMultiplier(displacementL: number | undefined, fuelType: string | undefined): number {
    // Electric vehicles
    if (fuelType) {
        const fuel = fuelType.toLowerCase();
        if (fuel.includes('electric') && !fuel.includes('hybrid')) {
            return EV_ENGINE_MULTIPLIER;
        }
    }

    // No displacement data
    if (!displacementL || displacementL <= 0) {
        return 1.00; // Default
    }

    // Find matching bracket
    for (const bracket of ENGINE_MULTIPLIERS) {
        if (displacementL <= bracket.maxDisplacement) {
            return bracket.multiplier;
        }
    }

    return 1.50; // Largest engines
}

/**
 * Gets drivetrain multiplier
 */
export function getDrivetrainMultiplier(driveType: string | undefined): number {
    if (!driveType) return 1.00;

    const drive = driveType.toLowerCase().trim();

    // Direct match
    if (DRIVETRAIN_MULTIPLIERS[drive]) {
        return DRIVETRAIN_MULTIPLIERS[drive];
    }

    // Partial match
    for (const [key, value] of Object.entries(DRIVETRAIN_MULTIPLIERS)) {
        if (drive.includes(key) || key.includes(drive)) {
            return value;
        }
    }

    return 1.00;
}

/**
 * Gets brand resale multiplier
 */
export function getBrandResaleMultiplier(make: string, model?: string): number {
    const makeLower = make.toLowerCase().trim();

    // Special case: Jeep Wrangler
    if (makeLower === 'jeep' && model) {
        const modelLower = model.toLowerCase();
        if (modelLower.includes('wrangler')) {
            return JEEP_WRANGLER_MULTIPLIER;
        }
    }

    return BRAND_RESALE_MULTIPLIERS[makeLower] ?? 0.90;
}

/**
 * Calculates inflation adjustment factor
 */
export function getInflationAdjustment(modelYear: number): number {
    const yearDiff = REFERENCE_YEAR - modelYear;
    if (yearDiff <= 0) return 1.0;
    return Math.pow(1 + ANNUAL_INFLATION, yearDiff);
}

/**
 * Determines confidence level for the estimate
 */
export function determineConfidence(
    bodyClassKnown: boolean,
    displacementKnown: boolean,
    driveTypeKnown: boolean,
    brandKnown: boolean
): 'high' | 'medium' | 'low' {
    const knownCount = [bodyClassKnown, displacementKnown, driveTypeKnown, brandKnown].filter(Boolean).length;

    if (knownCount >= 3) return 'high';
    if (knownCount >= 2) return 'medium';
    return 'low';
}

/**
 * Estimates MSRP for a vehicle based on VIN-decoded attributes
 *
 * Formula: Base MSRP × Engine × Drivetrain × Brand × Inflation
 */
export function estimateMsrp(attributes: VinAttributes, model?: string): MsrpEstimate {
    const { bodyClass, displacementL, fuelType, driveType, make, year } = attributes;

    // Map to category
    const category = mapBodyClassToCategory(bodyClass, make);
    const depreciationCategory = CATEGORY_TO_DEPRECIATION[category];

    // Get base MSRP
    const baseMsrp = CATEGORY_BASE_MSRP[category];

    // Calculate multipliers
    const engineMultiplier = getEngineMultiplier(displacementL, fuelType);
    const drivetrainMultiplier = getDrivetrainMultiplier(driveType);
    const brandMultiplier = getBrandResaleMultiplier(make, model);
    const inflationAdjustment = getInflationAdjustment(year);

    // Calculate estimated MSRP (for the year it was new)
    // We divide by inflation to get the historical MSRP
    const estimatedMsrp = Math.round(
        (baseMsrp * engineMultiplier * drivetrainMultiplier * brandMultiplier) / inflationAdjustment
    );

    // Determine confidence
    const confidence = determineConfidence(
        !!bodyClass,
        !!displacementL,
        !!driveType,
        !!BRAND_RESALE_MULTIPLIERS[make.toLowerCase()]
    );

    return {
        estimatedMsrp,
        category,
        depreciationCategory,
        confidence,
        source: 'estimated',
        factors: {
            baseCategory: baseMsrp,
            engineMultiplier,
            drivetrainMultiplier,
            brandMultiplier,
            inflationAdjustment,
        },
    };
}

/**
 * Checks if a fuel type indicates an electric vehicle
 */
export function isElectricVehicle(fuelType: string | undefined): boolean {
    if (!fuelType) return false;
    const fuel = fuelType.toLowerCase();
    return fuel.includes('electric') && !fuel.includes('hybrid');
}

/**
 * Checks if a fuel type indicates a hybrid vehicle
 */
export function isHybridVehicle(fuelType: string | undefined): boolean {
    if (!fuelType) return false;
    return fuelType.toLowerCase().includes('hybrid');
}

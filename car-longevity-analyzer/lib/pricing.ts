/**
 * Vehicle Pricing Estimation Module
 *
 * Provides fair market price estimation using:
 * - Dynamic MSRP estimation from VIN attributes
 * - Research-backed depreciation curves by vehicle category
 * - EV-specific depreciation model
 * - Regional pricing adjustments
 * - Model-specific reliability adjustments
 * - Confidence scoring system
 */

import {
    estimateMsrp,
    isElectricVehicle,
    type VinAttributes,
    type MsrpEstimate,
    type DepreciationCategory,
} from './msrp-estimator';
import {
    calculateRegionalAdjustment,
    type RegionalAdjustment,
} from './regional-pricing';
import {
    DEPRECIATION_CURVES,
    POST_10_YEAR_DEPRECIATION,
    BRAND_AVERAGE_RELIABILITY,
    RELIABILITY_PRICE_ADJUSTMENT_FACTOR,
    CONFIDENCE_RANGE_MARGINS,
    RANGE_EXPANSION_FACTORS,
    MILEAGE_ADJUSTMENT,
} from './constants';

export type PriceConfidence = 'high' | 'medium' | 'low' | 'very_low';

export interface PriceEstimate {
    low: number;
    high: number;
    midpoint: number;
}

export interface DetailedPriceEstimate extends PriceEstimate {
    confidence: PriceConfidence;
    msrpEstimate: MsrpEstimate;
    regionalAdjustment?: RegionalAdjustment;
    depreciationCategory: DepreciationCategory | 'ev';
    factors: {
        baseValue: number;
        depreciationRetention: number;
        mileageAdjustment: number;
        reliabilityAdjustment: number;
        regionalAdjustment: number;
    };
    warnings: string[];
}

// Legacy MSRP database for direct matches (higher confidence)
// Kept for backwards compatibility and higher accuracy on known models
const MSRP_DATABASE: Record<string, { baseMsrp: number; category: DepreciationCategory }> = {
    // TOYOTA
    'toyota camry': { baseMsrp: 28000, category: 'mainstream' },
    'toyota corolla': { baseMsrp: 23000, category: 'economy' },
    'toyota rav4': { baseMsrp: 32000, category: 'mainstream' },
    'toyota highlander': { baseMsrp: 42000, category: 'truck_suv' },
    'toyota tacoma': { baseMsrp: 35000, category: 'truck_suv' },
    'toyota tundra': { baseMsrp: 48000, category: 'truck_suv' },
    'toyota 4runner': { baseMsrp: 42000, category: 'truck_suv' },
    'toyota prius': { baseMsrp: 28000, category: 'economy' },
    'toyota avalon': { baseMsrp: 38000, category: 'mainstream' },
    'toyota sienna': { baseMsrp: 40000, category: 'mainstream' },
    'toyota sequoia': { baseMsrp: 62000, category: 'truck_suv' },
    'toyota land cruiser': { baseMsrp: 90000, category: 'truck_suv' },

    // HONDA
    'honda accord': { baseMsrp: 29000, category: 'mainstream' },
    'honda civic': { baseMsrp: 25000, category: 'economy' },
    'honda cr-v': { baseMsrp: 32000, category: 'mainstream' },
    'honda pilot': { baseMsrp: 42000, category: 'truck_suv' },
    'honda odyssey': { baseMsrp: 40000, category: 'mainstream' },
    'honda hr-v': { baseMsrp: 26000, category: 'mainstream' },
    'honda ridgeline': { baseMsrp: 42000, category: 'truck_suv' },

    // LEXUS
    'lexus es': { baseMsrp: 45000, category: 'luxury' },
    'lexus rx': { baseMsrp: 52000, category: 'luxury' },
    'lexus nx': { baseMsrp: 42000, category: 'luxury' },
    'lexus is': { baseMsrp: 42000, category: 'luxury' },
    'lexus gx': { baseMsrp: 65000, category: 'luxury' },

    // SUBARU
    'subaru outback': { baseMsrp: 32000, category: 'mainstream' },
    'subaru forester': { baseMsrp: 32000, category: 'mainstream' },
    'subaru crosstrek': { baseMsrp: 28000, category: 'mainstream' },
    'subaru impreza': { baseMsrp: 24000, category: 'economy' },

    // MAZDA
    'mazda mazda3': { baseMsrp: 24000, category: 'economy' },
    'mazda 3': { baseMsrp: 24000, category: 'economy' },
    'mazda cx-5': { baseMsrp: 30000, category: 'mainstream' },
    'mazda cx-9': { baseMsrp: 40000, category: 'truck_suv' },

    // HYUNDAI
    'hyundai sonata': { baseMsrp: 27000, category: 'mainstream' },
    'hyundai elantra': { baseMsrp: 22000, category: 'economy' },
    'hyundai tucson': { baseMsrp: 30000, category: 'mainstream' },
    'hyundai santa fe': { baseMsrp: 35000, category: 'mainstream' },
    'hyundai palisade': { baseMsrp: 40000, category: 'truck_suv' },

    // KIA
    'kia k5': { baseMsrp: 28000, category: 'mainstream' },
    'kia sorento': { baseMsrp: 35000, category: 'mainstream' },
    'kia sportage': { baseMsrp: 32000, category: 'mainstream' },
    'kia telluride': { baseMsrp: 40000, category: 'truck_suv' },

    // FORD
    'ford f-150': { baseMsrp: 45000, category: 'truck_suv' },
    'ford escape': { baseMsrp: 30000, category: 'mainstream' },
    'ford explorer': { baseMsrp: 40000, category: 'truck_suv' },
    'ford mustang': { baseMsrp: 35000, category: 'mainstream' },
    'ford ranger': { baseMsrp: 35000, category: 'truck_suv' },
    'ford bronco': { baseMsrp: 38000, category: 'truck_suv' },

    // CHEVROLET
    'chevrolet silverado': { baseMsrp: 45000, category: 'truck_suv' },
    'chevrolet silverado 1500': { baseMsrp: 45000, category: 'truck_suv' },
    'chevrolet equinox': { baseMsrp: 30000, category: 'mainstream' },
    'chevrolet tahoe': { baseMsrp: 58000, category: 'truck_suv' },
    'chevrolet traverse': { baseMsrp: 38000, category: 'truck_suv' },

    // GMC
    'gmc sierra': { baseMsrp: 48000, category: 'truck_suv' },
    'gmc sierra 1500': { baseMsrp: 48000, category: 'truck_suv' },
    'gmc yukon': { baseMsrp: 62000, category: 'truck_suv' },

    // RAM
    'ram 1500': { baseMsrp: 45000, category: 'truck_suv' },
    'ram 2500': { baseMsrp: 55000, category: 'truck_suv' },

    // DODGE
    'dodge charger': { baseMsrp: 35000, category: 'mainstream' },
    'dodge challenger': { baseMsrp: 35000, category: 'mainstream' },
    'dodge durango': { baseMsrp: 42000, category: 'truck_suv' },

    // JEEP
    'jeep wrangler': { baseMsrp: 35000, category: 'truck_suv' },
    'jeep grand cherokee': { baseMsrp: 45000, category: 'truck_suv' },

    // NISSAN
    'nissan altima': { baseMsrp: 27000, category: 'mainstream' },
    'nissan rogue': { baseMsrp: 30000, category: 'mainstream' },
    'nissan pathfinder': { baseMsrp: 40000, category: 'truck_suv' },
    'nissan frontier': { baseMsrp: 35000, category: 'truck_suv' },

    // VOLKSWAGEN
    'volkswagen jetta': { baseMsrp: 24000, category: 'economy' },
    'volkswagen tiguan': { baseMsrp: 32000, category: 'mainstream' },
    'volkswagen atlas': { baseMsrp: 40000, category: 'truck_suv' },

    // BMW
    'bmw 3 series': { baseMsrp: 45000, category: 'luxury' },
    'bmw 5 series': { baseMsrp: 58000, category: 'luxury' },
    'bmw x3': { baseMsrp: 48000, category: 'luxury' },
    'bmw x5': { baseMsrp: 65000, category: 'luxury' },

    // MERCEDES-BENZ
    'mercedes-benz c-class': { baseMsrp: 48000, category: 'luxury' },
    'mercedes-benz e-class': { baseMsrp: 60000, category: 'luxury' },
    'mercedes-benz glc': { baseMsrp: 48000, category: 'luxury' },
    'mercedes-benz gle': { baseMsrp: 60000, category: 'luxury' },

    // AUDI
    'audi a4': { baseMsrp: 45000, category: 'luxury' },
    'audi a6': { baseMsrp: 58000, category: 'luxury' },
    'audi q5': { baseMsrp: 48000, category: 'luxury' },
    'audi q7': { baseMsrp: 62000, category: 'luxury' },

    // TESLA
    'tesla model 3': { baseMsrp: 42000, category: 'mainstream' },
    'tesla model y': { baseMsrp: 48000, category: 'mainstream' },
    'tesla model s': { baseMsrp: 85000, category: 'luxury' },
    'tesla model x': { baseMsrp: 95000, category: 'luxury' },

    // PORSCHE
    'porsche 911': { baseMsrp: 115000, category: 'luxury' },
    'porsche cayenne': { baseMsrp: 75000, category: 'luxury' },
    'porsche macan': { baseMsrp: 62000, category: 'luxury' },

    // LAND ROVER
    'land rover range rover': { baseMsrp: 105000, category: 'luxury' },
    'land rover discovery': { baseMsrp: 62000, category: 'luxury' },
};

/**
 * Look up MSRP from database (high confidence if found)
 */
function lookupMsrpDatabase(make: string, model: string): { baseMsrp: number; category: DepreciationCategory } | null {
    const key = `${make.toLowerCase()} ${model.toLowerCase()}`;

    // Direct match
    if (MSRP_DATABASE[key]) {
        return MSRP_DATABASE[key];
    }

    // Partial match
    for (const [dbKey, data] of Object.entries(MSRP_DATABASE)) {
        if (key.includes(dbKey) || dbKey.includes(key.split(' ').slice(0, 2).join(' '))) {
            return data;
        }
    }

    return null;
}

/**
 * Gets depreciation retention for a given age using the appropriate curve
 */
function getDepreciationRetention(
    age: number,
    category: DepreciationCategory | 'ev'
): number {
    const curve = DEPRECIATION_CURVES[category];
    const postYearRate = POST_10_YEAR_DEPRECIATION[category];

    if (age <= 0) return 1.0;

    if (age <= 10) {
        // Use the curve values
        return curve[age];
    }

    // After year 10, apply additional depreciation
    const year10Value = curve[10];
    const additionalYears = age - 10;
    return year10Value * Math.pow(1 - postYearRate, additionalYears);
}

/**
 * Calculates mileage adjustment factor
 */
function calculateMileageAdjustment(mileage: number, age: number): number {
    const expectedMiles = age * MILEAGE_ADJUSTMENT.expectedPerYear;
    const mileageDeviation = mileage - expectedMiles;

    // Convert to percentage adjustment
    // Negative deviation (low mileage) = positive adjustment
    // Positive deviation (high mileage) = negative adjustment
    const adjustmentPer10k = MILEAGE_ADJUSTMENT.adjustmentPer10k;
    const rawAdjustment = -(mileageDeviation / 10000) * adjustmentPer10k;

    // Cap the adjustment
    return Math.max(
        -MILEAGE_ADJUSTMENT.maxAdjustment,
        Math.min(MILEAGE_ADJUSTMENT.maxAdjustment, rawAdjustment)
    );
}

/**
 * Calculates reliability-based price adjustment
 * Compares model reliability score to brand average
 */
function calculateReliabilityAdjustment(
    make: string,
    modelReliabilityScore: number | null
): number {
    if (modelReliabilityScore === null) return 0;

    const makeLower = make.toLowerCase();
    const brandAverage = BRAND_AVERAGE_RELIABILITY[makeLower];

    if (!brandAverage) return 0;

    const deviation = modelReliabilityScore - brandAverage;
    return deviation * RELIABILITY_PRICE_ADJUSTMENT_FACTOR;
}

/**
 * Determines overall price confidence
 */
function determineOverallConfidence(
    msrpConfidence: 'high' | 'medium' | 'low',
    age: number,
    isEV: boolean,
    dbMatch: boolean
): PriceConfidence {
    // Database match boosts confidence
    if (dbMatch && age <= 10 && !isEV) {
        return 'high';
    }

    // EVs max out at medium confidence due to market volatility
    if (isEV) {
        return msrpConfidence === 'low' ? 'low' : 'medium';
    }

    // Very old vehicles reduce confidence
    if (age > 20) {
        return 'low';
    }

    if (age > 15) {
        return msrpConfidence === 'high' ? 'medium' : 'low';
    }

    return msrpConfidence;
}

/**
 * Calculates price range margin based on confidence and vehicle characteristics
 */
function calculateRangeMargin(
    confidence: PriceConfidence,
    isLuxury: boolean,
    age: number,
    mileage: number
): number {
    let margin = CONFIDENCE_RANGE_MARGINS[confidence];

    // Luxury vehicles have more price variance
    if (isLuxury) {
        margin += RANGE_EXPANSION_FACTORS.luxury;
    }

    // Old vehicles have more condition variance
    if (age >= 15) {
        margin += RANGE_EXPANSION_FACTORS.old_vehicle;
    }

    // High mileage vehicles have more variance
    if (mileage >= 150000) {
        margin += RANGE_EXPANSION_FACTORS.high_mileage;
    }

    return margin;
}

/**
 * Main function: Estimates fair market price with full details
 */
export function estimateFairPriceDetailed(
    make: string,
    model: string,
    year: number,
    mileage: number,
    vinAttributes?: Partial<VinAttributes>,
    state?: string,
    modelReliabilityScore?: number | null
): DetailedPriceEstimate {
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - year);
    const warnings: string[] = [];

    // Try database lookup first
    const dbMatch = lookupMsrpDatabase(make, model);

    // Get MSRP estimate (from database or calculated)
    let msrpEstimate: MsrpEstimate;
    let depreciationCategory: DepreciationCategory | 'ev';
    let baseMsrp: number;

    const fuelType = vinAttributes?.fuelType;
    const isEV = isElectricVehicle(fuelType);

    if (dbMatch) {
        // Use database value
        baseMsrp = dbMatch.baseMsrp;
        depreciationCategory = isEV ? 'ev' : dbMatch.category;
        msrpEstimate = {
            estimatedMsrp: baseMsrp,
            category: 'unknown', // Not used when from DB
            depreciationCategory: dbMatch.category,
            confidence: 'high',
            source: 'database',
            factors: {
                baseCategory: baseMsrp,
                engineMultiplier: 1,
                drivetrainMultiplier: 1,
                brandMultiplier: 1,
                inflationAdjustment: 1,
            },
        };
    } else {
        // Calculate from VIN attributes
        const attributes: VinAttributes = {
            make,
            year,
            bodyClass: vinAttributes?.bodyClass,
            displacementL: vinAttributes?.displacementL,
            fuelType: vinAttributes?.fuelType,
            driveType: vinAttributes?.driveType,
        };

        msrpEstimate = estimateMsrp(attributes, model);
        baseMsrp = msrpEstimate.estimatedMsrp;
        depreciationCategory = isEV ? 'ev' : msrpEstimate.depreciationCategory;
    }

    // Apply inflation adjustment for historical MSRP if from database
    const inflationAdjustedMsrp = dbMatch
        ? baseMsrp / Math.pow(1.03, age) // Work backwards to get historical MSRP
        : baseMsrp;

    // Calculate depreciation
    const depreciationRetention = getDepreciationRetention(age, depreciationCategory);
    const depreciatedValue = inflationAdjustedMsrp * depreciationRetention;

    // Calculate mileage adjustment
    const mileageAdjustment = calculateMileageAdjustment(mileage, age);
    const mileageAdjustedValue = depreciatedValue * (1 + mileageAdjustment);

    // Calculate reliability adjustment
    const reliabilityAdjustment = calculateReliabilityAdjustment(make, modelReliabilityScore ?? null);
    const reliabilityAdjustedValue = mileageAdjustedValue * (1 + reliabilityAdjustment);

    // Calculate regional adjustment
    let regionalAdjustment: RegionalAdjustment | undefined;
    let regionalMultiplier = 1.0;

    if (state) {
        regionalAdjustment = calculateRegionalAdjustment(
            state,
            vinAttributes?.bodyClass,
            vinAttributes?.fuelType,
            vinAttributes?.driveType
        );
        regionalMultiplier = regionalAdjustment.totalMultiplier;
    }

    const finalValue = reliabilityAdjustedValue * regionalMultiplier;

    // Determine confidence
    const confidence = determineOverallConfidence(
        msrpEstimate.confidence,
        age,
        isEV,
        !!dbMatch
    );

    // Calculate range
    const isLuxury = depreciationCategory === 'luxury';
    const rangeMargin = calculateRangeMargin(confidence, isLuxury, age, mileage);

    const midpoint = Math.round(finalValue);
    const low = Math.round(finalValue * (1 - rangeMargin));
    const high = Math.round(finalValue * (1 + rangeMargin));

    // Add warnings
    if (isEV) {
        warnings.push('EV prices are volatile due to rapid technology changes and new model releases');
    }

    if (age > 20) {
        warnings.push('Very old vehicles have high condition variance - price depends heavily on maintenance history');
    }

    if (mileage > 200000) {
        warnings.push('Extremely high mileage - mechanical condition is critical');
    }

    if (!dbMatch && msrpEstimate.confidence === 'low') {
        warnings.push('Limited vehicle data available - estimate based on category averages');
    }

    // Ensure minimum values
    const absoluteMin = 1500;

    return {
        low: Math.max(absoluteMin, low),
        high: Math.max(absoluteMin + 500, high),
        midpoint: Math.max(absoluteMin + 250, midpoint),
        confidence,
        msrpEstimate,
        regionalAdjustment,
        depreciationCategory,
        factors: {
            baseValue: inflationAdjustedMsrp,
            depreciationRetention,
            mileageAdjustment,
            reliabilityAdjustment,
            regionalAdjustment: regionalMultiplier,
        },
        warnings,
    };
}

/**
 * Simplified interface for backwards compatibility
 */
export function estimateFairPrice(
    make: string,
    model: string,
    year: number,
    mileage: number
): PriceEstimate {
    const detailed = estimateFairPriceDetailed(make, model, year, mileage);
    return {
        low: detailed.low,
        high: detailed.high,
        midpoint: detailed.midpoint,
    };
}

/**
 * Get approximate MSRP (convenience function for backwards compatibility)
 */
export function getApproximateMsrp(make: string, model: string): number {
    const dbMatch = lookupMsrpDatabase(make, model);
    if (dbMatch) {
        return dbMatch.baseMsrp;
    }

    // Fallback to estimated
    const estimate = estimateMsrp({ make, year: new Date().getFullYear() }, model);
    return estimate.estimatedMsrp;
}

// Re-export types for API compatibility
export interface MsrpData {
    baseMsrp: number;
    category: 'economy' | 'midsize' | 'luxury' | 'truck' | 'suv';
}

export function getMsrpData(make: string, model: string): MsrpData {
    const dbMatch = lookupMsrpDatabase(make, model);
    if (dbMatch) {
        // Map new categories to legacy categories
        const categoryMap: Record<DepreciationCategory, MsrpData['category']> = {
            economy: 'economy',
            mainstream: 'midsize',
            truck_suv: 'truck',
            luxury: 'luxury',
        };
        return {
            baseMsrp: dbMatch.baseMsrp,
            category: categoryMap[dbMatch.category],
        };
    }

    // Fallback
    return { baseMsrp: 28000, category: 'midsize' };
}

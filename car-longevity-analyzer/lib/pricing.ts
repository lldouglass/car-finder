/**
 * Vehicle pricing estimation utilities.
 *
 * NEW APPROACH:
 * - Cars 0-10 years: Depreciation model with inflation-adjusted MSRP
 * - Cars 10+ years: Market-based bracket system (mileage + condition)
 *
 * The old approach was fundamentally broken because:
 * 1. It used current MSRP for old cars (wrong starting point)
 * 2. Depreciation curves don't apply to 20+ year old cars
 * 3. "Expected mileage" made old low-mileage cars overpriced
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

// Average annual inflation rate for adjusting historical MSRPs
const ANNUAL_INFLATION = 0.03; // 3% per year

/**
 * Mileage brackets for older vehicles (10+ years)
 * Values are multipliers applied to base value
 */
const MILEAGE_BRACKETS = [
    { maxMiles: 50000, multiplier: 1.25, label: 'very low' },
    { maxMiles: 75000, multiplier: 1.10, label: 'low' },
    { maxMiles: 100000, multiplier: 1.00, label: 'average' },
    { maxMiles: 125000, multiplier: 0.85, label: 'above average' },
    { maxMiles: 150000, multiplier: 0.70, label: 'high' },
    { maxMiles: 175000, multiplier: 0.55, label: 'very high' },
    { maxMiles: 200000, multiplier: 0.40, label: 'extreme' },
    { maxMiles: Infinity, multiplier: 0.25, label: 'salvage territory' },
];

/**
 * Base values for older vehicles (10+ years) by category
 * These represent typical values for a 10-year-old vehicle with ~100k miles
 */
const OLDER_CAR_BASE_VALUES: Record<MsrpData['category'], number> = {
    economy: 6000,
    midsize: 8000,
    suv: 10000,
    truck: 12000,
    luxury: 12000, // Luxury depreciates fast but has a floor
};

/**
 * Brand value multipliers for older cars
 * Reliable brands hold value better in the used market
 */
const BRAND_VALUE_MULTIPLIERS: Record<string, number> = {
    // Premium (excellent reliability, high demand)
    'toyota': 1.35,
    'lexus': 1.30,
    'honda': 1.30,

    // Above average
    'mazda': 1.15,
    'subaru': 1.15,
    'acura': 1.10,

    // Average
    'hyundai': 1.00,
    'kia': 1.00,
    'ford': 0.95,
    'chevrolet': 0.95,
    'gmc': 1.00,
    'ram': 1.05,
    'nissan': 0.90,

    // Below average (reliability concerns or oversupply)
    'dodge': 0.85,
    'chrysler': 0.80,
    'jeep': 0.90,
    'volkswagen': 0.85,
    'mitsubishi': 0.80,

    // Luxury (fast depreciation)
    'bmw': 0.75,
    'mercedes-benz': 0.75,
    'mercedes': 0.75,
    'audi': 0.75,
    'infiniti': 0.70,
    'cadillac': 0.65,
    'lincoln': 0.65,
    'jaguar': 0.60,
    'land rover': 0.60,
    'volvo': 0.80,

    // Electric/newer brands
    'tesla': 1.10,
    'rivian': 1.00,
};

/**
 * Age decay for older vehicles
 * After 10 years, value continues to decline but at a slower rate
 */
function getAgeDecayMultiplier(age: number): number {
    if (age <= 10) return 1.0;
    if (age <= 15) return 0.85;
    if (age <= 20) return 0.65;
    if (age <= 25) return 0.50;
    if (age <= 30) return 0.35;
    return 0.25; // 30+ years - collector or beater territory
}

/**
 * MSRP database - current MSRPs for reference
 * For older cars, we'll adjust these for inflation
 */
const MSRP_DATABASE: Record<string, MsrpData> = {
    // TOYOTA
    'toyota camry': { baseMsrp: 28000, category: 'midsize' },
    'toyota corolla': { baseMsrp: 23000, category: 'economy' },
    'toyota rav4': { baseMsrp: 32000, category: 'suv' },
    'toyota highlander': { baseMsrp: 42000, category: 'suv' },
    'toyota tacoma': { baseMsrp: 35000, category: 'truck' },
    'toyota tundra': { baseMsrp: 48000, category: 'truck' },
    'toyota 4runner': { baseMsrp: 42000, category: 'suv' },
    'toyota prius': { baseMsrp: 28000, category: 'economy' },
    'toyota avalon': { baseMsrp: 38000, category: 'midsize' },
    'toyota sienna': { baseMsrp: 40000, category: 'suv' },
    'toyota sequoia': { baseMsrp: 62000, category: 'suv' },
    'toyota land cruiser': { baseMsrp: 90000, category: 'suv' },
    'toyota yaris': { baseMsrp: 18000, category: 'economy' },

    // HONDA
    'honda accord': { baseMsrp: 29000, category: 'midsize' },
    'honda civic': { baseMsrp: 25000, category: 'economy' },
    'honda cr-v': { baseMsrp: 32000, category: 'suv' },
    'honda pilot': { baseMsrp: 42000, category: 'suv' },
    'honda odyssey': { baseMsrp: 40000, category: 'suv' },
    'honda hr-v': { baseMsrp: 26000, category: 'suv' },
    'honda ridgeline': { baseMsrp: 42000, category: 'truck' },
    'honda fit': { baseMsrp: 20000, category: 'economy' },

    // LEXUS
    'lexus es': { baseMsrp: 45000, category: 'luxury' },
    'lexus rx': { baseMsrp: 52000, category: 'luxury' },
    'lexus nx': { baseMsrp: 42000, category: 'luxury' },
    'lexus is': { baseMsrp: 42000, category: 'luxury' },
    'lexus gx': { baseMsrp: 65000, category: 'luxury' },

    // ACURA
    'acura tlx': { baseMsrp: 45000, category: 'luxury' },
    'acura mdx': { baseMsrp: 52000, category: 'luxury' },
    'acura rdx': { baseMsrp: 45000, category: 'luxury' },

    // SUBARU
    'subaru outback': { baseMsrp: 32000, category: 'suv' },
    'subaru forester': { baseMsrp: 32000, category: 'suv' },
    'subaru crosstrek': { baseMsrp: 28000, category: 'suv' },
    'subaru impreza': { baseMsrp: 24000, category: 'economy' },
    'subaru wrx': { baseMsrp: 32000, category: 'midsize' },

    // MAZDA
    'mazda mazda3': { baseMsrp: 24000, category: 'economy' },
    'mazda 3': { baseMsrp: 24000, category: 'economy' },
    'mazda mazda6': { baseMsrp: 28000, category: 'midsize' },
    'mazda 6': { baseMsrp: 28000, category: 'midsize' },
    'mazda cx-5': { baseMsrp: 30000, category: 'suv' },
    'mazda cx-9': { baseMsrp: 40000, category: 'suv' },
    'mazda miata': { baseMsrp: 30000, category: 'midsize' },
    'mazda mx-5': { baseMsrp: 30000, category: 'midsize' },

    // HYUNDAI
    'hyundai sonata': { baseMsrp: 27000, category: 'midsize' },
    'hyundai elantra': { baseMsrp: 22000, category: 'economy' },
    'hyundai tucson': { baseMsrp: 30000, category: 'suv' },
    'hyundai santa fe': { baseMsrp: 35000, category: 'suv' },
    'hyundai palisade': { baseMsrp: 40000, category: 'suv' },

    // KIA
    'kia optima': { baseMsrp: 26000, category: 'midsize' },
    'kia k5': { baseMsrp: 28000, category: 'midsize' },
    'kia sorento': { baseMsrp: 35000, category: 'suv' },
    'kia sportage': { baseMsrp: 32000, category: 'suv' },
    'kia telluride': { baseMsrp: 40000, category: 'suv' },
    'kia soul': { baseMsrp: 22000, category: 'economy' },

    // FORD
    'ford f-150': { baseMsrp: 45000, category: 'truck' },
    'ford escape': { baseMsrp: 30000, category: 'suv' },
    'ford fusion': { baseMsrp: 26000, category: 'midsize' },
    'ford explorer': { baseMsrp: 40000, category: 'suv' },
    'ford mustang': { baseMsrp: 35000, category: 'midsize' },
    'ford ranger': { baseMsrp: 35000, category: 'truck' },
    'ford bronco': { baseMsrp: 38000, category: 'suv' },

    // CHEVROLET
    'chevrolet silverado': { baseMsrp: 45000, category: 'truck' },
    'chevrolet silverado 1500': { baseMsrp: 45000, category: 'truck' },
    'chevrolet equinox': { baseMsrp: 30000, category: 'suv' },
    'chevrolet malibu': { baseMsrp: 26000, category: 'midsize' },
    'chevrolet tahoe': { baseMsrp: 58000, category: 'suv' },
    'chevrolet traverse': { baseMsrp: 38000, category: 'suv' },
    'chevrolet camaro': { baseMsrp: 30000, category: 'midsize' },
    'chevrolet colorado': { baseMsrp: 35000, category: 'truck' },

    // GMC
    'gmc sierra': { baseMsrp: 48000, category: 'truck' },
    'gmc sierra 1500': { baseMsrp: 48000, category: 'truck' },
    'gmc yukon': { baseMsrp: 62000, category: 'suv' },
    'gmc acadia': { baseMsrp: 40000, category: 'suv' },
    'gmc terrain': { baseMsrp: 32000, category: 'suv' },

    // RAM
    'ram 1500': { baseMsrp: 45000, category: 'truck' },
    'ram 2500': { baseMsrp: 55000, category: 'truck' },

    // DODGE
    'dodge charger': { baseMsrp: 35000, category: 'midsize' },
    'dodge challenger': { baseMsrp: 35000, category: 'midsize' },
    'dodge durango': { baseMsrp: 42000, category: 'suv' },

    // JEEP
    'jeep wrangler': { baseMsrp: 35000, category: 'suv' },
    'jeep grand cherokee': { baseMsrp: 45000, category: 'suv' },
    'jeep cherokee': { baseMsrp: 35000, category: 'suv' },
    'jeep compass': { baseMsrp: 30000, category: 'suv' },

    // NISSAN
    'nissan altima': { baseMsrp: 27000, category: 'midsize' },
    'nissan rogue': { baseMsrp: 30000, category: 'suv' },
    'nissan sentra': { baseMsrp: 22000, category: 'economy' },
    'nissan maxima': { baseMsrp: 40000, category: 'midsize' },
    'nissan pathfinder': { baseMsrp: 40000, category: 'suv' },
    'nissan frontier': { baseMsrp: 35000, category: 'truck' },

    // VOLKSWAGEN
    'volkswagen jetta': { baseMsrp: 24000, category: 'economy' },
    'volkswagen passat': { baseMsrp: 30000, category: 'midsize' },
    'volkswagen tiguan': { baseMsrp: 32000, category: 'suv' },
    'volkswagen atlas': { baseMsrp: 40000, category: 'suv' },
    'volkswagen golf': { baseMsrp: 28000, category: 'economy' },

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

    // VOLVO
    'volvo xc90': { baseMsrp: 58000, category: 'luxury' },
    'volvo xc60': { baseMsrp: 48000, category: 'luxury' },
    'volvo xc40': { baseMsrp: 40000, category: 'luxury' },
    'volvo s60': { baseMsrp: 45000, category: 'luxury' },

    // TESLA
    'tesla model 3': { baseMsrp: 42000, category: 'midsize' },
    'tesla model y': { baseMsrp: 48000, category: 'suv' },
    'tesla model s': { baseMsrp: 85000, category: 'luxury' },
    'tesla model x': { baseMsrp: 95000, category: 'luxury' },

    // CHRYSLER
    'chrysler pacifica': { baseMsrp: 42000, category: 'suv' },
    'chrysler 300': { baseMsrp: 38000, category: 'midsize' },

    // BUICK
    'buick enclave': { baseMsrp: 48000, category: 'luxury' },
    'buick encore': { baseMsrp: 28000, category: 'luxury' },

    // CADILLAC
    'cadillac escalade': { baseMsrp: 85000, category: 'luxury' },
    'cadillac xt5': { baseMsrp: 48000, category: 'luxury' },

    // LINCOLN
    'lincoln navigator': { baseMsrp: 85000, category: 'luxury' },
    'lincoln aviator': { baseMsrp: 58000, category: 'luxury' },

    // INFINITI
    'infiniti q50': { baseMsrp: 45000, category: 'luxury' },
    'infiniti qx60': { baseMsrp: 52000, category: 'luxury' },

    // MITSUBISHI
    'mitsubishi outlander': { baseMsrp: 32000, category: 'suv' },
    'mitsubishi mirage': { baseMsrp: 18000, category: 'economy' },

    // PORSCHE
    'porsche 911': { baseMsrp: 115000, category: 'luxury' },
    'porsche cayenne': { baseMsrp: 75000, category: 'luxury' },
    'porsche macan': { baseMsrp: 62000, category: 'luxury' },

    // LAND ROVER
    'land rover range rover': { baseMsrp: 105000, category: 'luxury' },
    'land rover discovery': { baseMsrp: 62000, category: 'luxury' },

    // JAGUAR
    'jaguar f-pace': { baseMsrp: 58000, category: 'luxury' },
    'jaguar xe': { baseMsrp: 48000, category: 'luxury' },
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

    // Partial match
    for (const [dbKey, data] of Object.entries(MSRP_DATABASE)) {
        if (key.includes(dbKey) || dbKey.includes(key.split(' ').slice(0, 2).join(' '))) {
            return data;
        }
    }

    // Default fallback based on make
    const makeOnly = make.toLowerCase();
    if (['bmw', 'mercedes-benz', 'mercedes', 'audi', 'lexus', 'porsche', 'jaguar', 'land rover', 'cadillac', 'lincoln'].includes(makeOnly)) {
        return { baseMsrp: 50000, category: 'luxury' };
    }
    if (['ford', 'chevrolet', 'gmc', 'ram', 'toyota', 'nissan'].includes(makeOnly)) {
        return { baseMsrp: 35000, category: 'truck' };
    }

    return { baseMsrp: 28000, category: 'midsize' };
}

/**
 * Get the mileage bracket multiplier
 */
function getMileageBracketMultiplier(mileage: number): { multiplier: number; label: string } {
    for (const bracket of MILEAGE_BRACKETS) {
        if (mileage <= bracket.maxMiles) {
            return { multiplier: bracket.multiplier, label: bracket.label };
        }
    }
    return { multiplier: 0.25, label: 'salvage territory' };
}

/**
 * Get brand value multiplier
 */
function getBrandMultiplier(make: string): number {
    const normalizedMake = make.toLowerCase().trim();
    return BRAND_VALUE_MULTIPLIERS[normalizedMake] ?? 0.90;
}

/**
 * Estimate fair price for NEWER vehicles (0-10 years old)
 * Uses depreciation model with inflation-adjusted MSRP
 */
function estimateNewerCarPrice(
    msrpData: MsrpData,
    make: string,
    age: number,
    mileage: number
): PriceEstimate {
    // Adjust MSRP for inflation (work backwards from current MSRP)
    const inflationAdjustedMsrp = msrpData.baseMsrp / Math.pow(1 + ANNUAL_INFLATION, age);

    // Depreciation curve for newer cars (less aggressive - matches real market better)
    // Year 1: 15% drop (off the lot), Year 2-3: 10% per year, Year 4+: 8% per year
    let value = inflationAdjustedMsrp;
    for (let year = 1; year <= age; year++) {
        if (year === 1) {
            value *= 0.85; // 15% first year depreciation
        } else if (year <= 3) {
            value *= 0.90; // 10% years 2-3
        } else {
            value *= 0.92; // 8% years 4+
        }
    }

    // Mileage adjustment for newer cars
    // Expected: 12,000 miles/year
    const expectedMiles = age * 12000;
    const mileageDiff = mileage - expectedMiles;

    // 2% adjustment per 10,000 miles difference
    const mileageAdjustment = (mileageDiff / 10000) * -0.02;
    const cappedAdjustment = Math.max(-0.20, Math.min(0.15, mileageAdjustment));
    value *= (1 + cappedAdjustment);

    // Brand multiplier
    value *= getBrandMultiplier(make);

    // Calculate range (±10%)
    const midpoint = Math.round(value);
    const low = Math.round(value * 0.90);
    const high = Math.round(value * 1.10);

    return {
        low: Math.max(3000, low),
        high: Math.max(4000, high),
        midpoint: Math.max(3500, midpoint),
    };
}

/**
 * Estimate fair price for OLDER vehicles (10+ years old)
 * Uses market-based bracket system
 */
function estimateOlderCarPrice(
    msrpData: MsrpData,
    make: string,
    age: number,
    mileage: number
): PriceEstimate {
    // Start with category base value
    let baseValue = OLDER_CAR_BASE_VALUES[msrpData.category];

    // Apply brand multiplier (Toyota/Honda worth more than Chrysler)
    baseValue *= getBrandMultiplier(make);

    // Apply age decay (cars continue to depreciate after 10 years)
    baseValue *= getAgeDecayMultiplier(age);

    // Apply mileage bracket multiplier (this is the big one for old cars)
    const mileageBracket = getMileageBracketMultiplier(mileage);
    baseValue *= mileageBracket.multiplier;

    // Special cases
    // Trucks and 4Runners hold value exceptionally well
    if (msrpData.category === 'truck' ||
        make.toLowerCase() === 'toyota' && ['4runner', 'land cruiser', 'tacoma'].some(m =>
            make.toLowerCase().includes(m))) {
        baseValue *= 1.20;
    }

    // Calculate range (±15% for older cars - more variance)
    const midpoint = Math.round(baseValue);
    const low = Math.round(baseValue * 0.85);
    const high = Math.round(baseValue * 1.15);

    // Absolute minimum floor
    const absoluteMin = 1500;

    return {
        low: Math.max(absoluteMin, low),
        high: Math.max(absoluteMin + 500, high),
        midpoint: Math.max(absoluteMin + 250, midpoint),
    };
}

/**
 * Main function: Estimate fair market price for a vehicle
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

    // Use different models based on age
    if (age <= 10) {
        return estimateNewerCarPrice(msrpData, make, age, mileage);
    } else {
        return estimateOlderCarPrice(msrpData, make, age, mileage);
    }
}

/**
 * Get approximate MSRP (convenience function)
 */
export function getApproximateMsrp(make: string, model: string): number {
    return getMsrpData(make, model).baseMsrp;
}

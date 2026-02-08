/**
 * Shared constants for the Car Longevity Analyzer
 */

// Scoring weights for overall score calculation
export const SCORE_WEIGHTS = {
    reliability: 0.30,
    longevity: 0.30,
    price: 0.25,
    safety: 0.15,
} as const;

// Safety thresholds for red flag detection
export const SAFETY_THRESHOLDS = {
    highInjuryCount: 5,      // 5+ injuries = high severity flag
    highFireCount: 3,        // 3+ fires = high severity flag
    highCrashCount: 20,      // 20+ crashes = medium severity flag
    poorCrashRating: 2,      // 2 stars or below = medium severity flag
    lowSafetyScore: 5,       // Below 5 = low severity flag
} as const;

// Red flag score penalties - moderate to avoid over-penalizing
// Most used cars will have some complaints, especially older/high-volume models
export const RED_FLAG_PENALTIES = {
    critical: 3.0,  // Salvage title, frame damage, flood damage
    high: 0.5,      // Fire/serious safety reports
    medium: 0.2,    // Moderate concerns
    low: 0.1,       // Minor issues
} as const;

// Recommendation thresholds - calibrated for realistic used car market
export const RECOMMENDATION_THRESHOLDS = {
    buy: 6.5,    // Score >= 6.5 = BUY (good reliable vehicle at fair price)
    maybe: 4.0,  // Score >= 4.0 = MAYBE (worth considering with inspection)
} as const;

// Vehicle age and mileage constants
export const VEHICLE_CONSTANTS = {
    avgMilesPerYear: 12000,
    maxVehicleAgeYears: 50,
    minVehicleYear: 1900,
    defaultFallbackAge: 5, // Years to subtract from current year for unknown vehicles
} as const;

// Pricing constants
export const PRICING_CONSTANTS = {
    minimumValue: 2000,
    mileageAdjustmentPer10k: 0.02, // 2% per 10,000 miles
    maxMileageAdjustment: 0.15,    // Cap at 15%
    priceRangeMargin: 0.08,        // 8% margin for low/high range
} as const;

// Price anomaly detection thresholds
export const PRICE_ANOMALY_THRESHOLDS = {
    suspiciouslyLow: 0.30,   // 30% below market = suspicious
    significantlyLow: 0.15,  // 15% below market = significant
} as const;

// API timeouts (in milliseconds)
export const API_TIMEOUTS = {
    vinAnalysis: 30000,      // 30 seconds
    listingAnalysis: 60000,  // 60 seconds for AI processing
    nhtsaDelay: 100,         // Rate limiting delay between NHTSA calls
} as const;

// Input validation limits
export const INPUT_LIMITS = {
    maxListingLength: 15000,
    vinLength: 17,
    maxMileage: 1000000,
    maxPrice: 10000000,
} as const;

// Rate limiting defaults
export const RATE_LIMIT_DEFAULTS = {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
} as const;

// Abuse prevention for unauthenticated analysis (invisible to normal users)
export const UNAUTH_ANALYSIS_RATE_LIMIT = {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
} as const;

// Lifespan adjustment limits (multiplier bounds)
export const LIFESPAN_ADJUSTMENT_LIMITS = {
    minMultiplier: 0.5,  // Floor at 50% of base lifespan
    maxMultiplier: 1.5,  // Cap at 150% of base lifespan
    defaultLifespan: 130000, // Default lifespan when vehicle not in database (calibrated to real-world data)
} as const;

// HTTP status codes with user-friendly messages
export const ERROR_MESSAGES: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    403: 'Access forbidden. Please check your permissions.',
    404: 'Vehicle not found. Please verify the VIN.',
    408: 'Request timed out. Please try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again later.',
} as const;

// ============================================
// PRICING SYSTEM CONSTANTS
// ============================================

/**
 * Brand average reliability scores
 * Used to calculate model-specific reliability adjustment
 * Each point deviation from brand average = ~3.3% price adjustment
 */
export const BRAND_AVERAGE_RELIABILITY: Record<string, number> = {
    'toyota': 8.5,
    'lexus': 8.5,
    'honda': 8.0,
    'acura': 8.0,
    'mazda': 7.5,
    'subaru': 7.0,
    'hyundai': 6.5,
    'kia': 6.5,
    'genesis': 7.0,
    'ford': 6.0,
    'chevrolet': 6.0,
    'gmc': 6.0,
    'ram': 6.0,
    'dodge': 5.0,
    'chrysler': 4.5,
    'jeep': 5.5,
    'nissan': 5.5,
    'infiniti': 5.5,
    'volkswagen': 6.0,
    'bmw': 5.5,
    'mercedes-benz': 5.5,
    'mercedes': 5.5,
    'audi': 5.5,
    'porsche': 7.0,
    'volvo': 6.0,
    'jaguar': 4.5,
    'land rover': 4.0,
    'cadillac': 5.0,
    'lincoln': 5.5,
    'buick': 5.5,
    'mitsubishi': 5.0,
    'tesla': 6.5,
    'rivian': 6.0,
} as const;

/**
 * Depreciation curves by vehicle category
 * Values represent retention percentage at each year (index 0 = new, index 10 = year 10)
 * Years 8-10 adjusted upward to reflect survivor bias (well-maintained vehicles)
 */
export const DEPRECIATION_CURVES = {
    // Economy cars (Civic, Corolla, etc.)
    economy: [1.00, 0.82, 0.72, 0.63, 0.55, 0.48, 0.42, 0.37, 0.35, 0.32, 0.29],
    // Mainstream (Accord, Camry, CR-V, etc.)
    mainstream: [1.00, 0.85, 0.76, 0.68, 0.61, 0.54, 0.48, 0.43, 0.40, 0.36, 0.34],
    // Trucks and SUVs (F-150, Tacoma, 4Runner, etc.)
    truck_suv: [1.00, 0.88, 0.80, 0.73, 0.67, 0.61, 0.56, 0.51, 0.49, 0.46, 0.43],
    // Luxury (BMW, Mercedes, Audi, etc.)
    luxury: [1.00, 0.75, 0.62, 0.52, 0.44, 0.38, 0.33, 0.29, 0.27, 0.25, 0.23],
    // Electric vehicles (steeper early depreciation)
    ev: [1.00, 0.70, 0.58, 0.50, 0.44, 0.40, 0.37, 0.35, 0.34, 0.33, 0.32],
} as const;

/**
 * Annual depreciation rates after year 10
 */
export const POST_10_YEAR_DEPRECIATION: Record<string, number> = {
    economy: 0.08,     // -8% per year
    mainstream: 0.07,  // -7% per year
    truck_suv: 0.06,   // -6% per year
    luxury: 0.05,      // -5% per year
    ev: 0.03,          // -3% per year (flattens out)
} as const;

/**
 * Reliability adjustment factor
 * Each 1-point deviation from brand average = this % price adjustment
 */
export const RELIABILITY_PRICE_ADJUSTMENT_FACTOR = 0.033; // 3.3%

/**
 * Confidence-based price range margins
 */
export const CONFIDENCE_RANGE_MARGINS: Record<string, number> = {
    high: 0.08,       // ±8%
    medium: 0.12,     // ±12%
    low: 0.18,        // ±18%
    very_low: 0.25,   // ±25%
} as const;

/**
 * Additional range expansion factors
 */
export const RANGE_EXPANSION_FACTORS = {
    luxury: 0.03,         // +3% for luxury vehicles
    old_vehicle: 0.05,    // +5% for vehicles 15+ years old
    high_mileage: 0.05,   // +5% for vehicles with 150k+ miles
} as const;

/**
 * Mileage adjustment constants
 */
export const MILEAGE_ADJUSTMENT = {
    expectedPerYear: 12000,
    adjustmentPer10k: 0.02,   // 2% per 10,000 miles
    maxAdjustment: 0.20,      // Cap at ±20%
} as const;

/**
 * Market condition multiplier
 * Accounts for current used car market conditions relative to historical norms.
 * Post-pandemic market remains elevated vs pre-2020 levels.
 */
export const MARKET_CONDITION = {
    multiplier: 1.10,           // Current market is ~10% elevated vs historical
    effectiveDate: '2025-01',   // When this was calibrated
} as const;

// Stripe subscription status constants
export const STRIPE_SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    UNPAID: 'unpaid',
    PAST_DUE: 'past_due',
} as const;

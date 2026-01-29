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

// Lifespan adjustment limits (multiplier bounds)
export const LIFESPAN_ADJUSTMENT_LIMITS = {
    minMultiplier: 0.5,  // Floor at 50% of base lifespan
    maxMultiplier: 1.5,  // Cap at 150% of base lifespan
    defaultLifespan: 200000, // Default lifespan when vehicle not in database
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

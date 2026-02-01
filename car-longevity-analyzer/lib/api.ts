// API Types based on route responses

export type SellerType = 'cpo' | 'franchise_same' | 'franchise_other' | 'independent_lot' | 'private' | 'auction' | 'unknown';

export interface VinAnalysisRequest {
    vin: string;
    mileage: number;
    askingPrice: number;
    listingText?: string;
    sellerType?: SellerType;
}

export interface ListingAnalysisRequest {
    listingText: string;
    askingPrice?: number;
    mileage?: number;
    sellerType?: SellerType;
}

// Seller Risk types
export interface SellerRiskResult {
    sellerType: SellerType;
    riskLevel: 'low' | 'medium' | 'high' | 'variable';
    riskScore: number;
    advice: string[];
    protections: string[];
    warnings: string[];
    negotiationTips: string[];
}

// Negotiation types
export interface NegotiationPoint {
    category: 'price' | 'condition' | 'market' | 'issues' | 'history' | 'timing';
    point: string;
    leverage: 'strong' | 'moderate' | 'weak';
    suggestedReduction: number;
    script?: string;
}

export interface NegotiationStrategy {
    overallLeverage: 'strong' | 'moderate' | 'weak' | 'none';
    suggestedOffer: number;
    walkAwayPrice: number;
    points: NegotiationPoint[];
    openingStatement: string;
}

// Maintenance Cost types
export interface UpcomingMaintenance {
    item: string;
    mileageRange: string;
    estimatedCost: { low: number; high: number };
    urgency: 'due_now' | 'upcoming' | 'future';
}

export interface MaintenanceCostEstimate {
    estimatedAnnualCost: { low: number; high: number };
    category: 'economy' | 'standard' | 'premium' | 'luxury';
    categoryLabel: string;
    upcomingMaintenance: UpcomingMaintenance[];
    knownIssueRisks: { issue: string; probability: string; cost: { low: number; high: number }; mileageRange: string }[];
    fiveYearProjection: { low: number; high: number };
    costFactors: string[];
}

// Inspection Checklist types
export interface InspectionItem {
    category: string;
    item: string;
    priority: 'critical' | 'important' | 'recommended';
    reason?: string;
    whatToLookFor: string;
    redFlagSigns: string[];
}

export interface InspectionChecklist {
    vehicleSpecificItems: InspectionItem[];
    estimatedInspectionTime: string;
}

// Warranty Value types
export type WarrantyType = 'factory_full' | 'factory_powertrain' | 'cpo' | 'third_party' | 'none' | 'unknown';

export interface WarrantyInfo {
    type: WarrantyType;
    monthsRemaining?: number;
    milesRemaining?: number;
}

export interface WarrantyValueResult {
    estimatedValue: { low: number; high: number };
    valueExplanation: string;
    recommendation: string;
    coverageQuality: 'excellent' | 'good' | 'limited' | 'none';
    equivalentExtendedWarrantyCost: { low: number; high: number };
    warrantyTips: string[];
}

// Price Thresholds types
export interface PriceThresholds {
    buyThreshold: number | null;
    maybeThreshold: number | null;
    currentVerdict: 'BUY' | 'MAYBE' | 'PASS';
    priceImpact: string;
}

export interface Vehicle {
    year: number | null;
    make: string | null;
    model: string | null;
    trim?: string | null;
}

export interface Scores {
    reliability: number | null;
    longevity: number | null;
    priceValue: number | null;
    overall: number | null;
}

export interface Longevity {
    estimatedRemainingMiles: number;
    remainingYears: number;
    percentUsed: number;
    expectedLifespan?: number;
    baseLifespan?: number;
}

export interface AppliedFactor {
    category: string;
    value: string;
    multiplier: number;
    impact: 'positive' | 'negative' | 'neutral';
}

export interface LifespanAnalysis {
    baseLifespan: number;
    adjustedLifespan: number;
    totalMultiplier: number;
    appliedFactors: AppliedFactor[];
    confidence: 'high' | 'medium' | 'low';
}

export interface ReliabilityAnalysis {
    baseScore: number;
    yearAdjustment: number;
    isYearToAvoid: boolean;
    inDatabase: boolean;
}

export interface Pricing {
    askingPrice: number;
    fairPriceLow: number;
    fairPriceHigh: number;
    dealQuality: 'GREAT' | 'GOOD' | 'FAIR' | 'HIGH' | 'OVERPRICED';
    analysis: string;
    source?: 'api' | 'calculated';
    confidence?: 'high' | 'medium' | 'low';
    sampleSize?: number;
}

export interface RedFlag {
    type: string;
    severity: string;
    message: string;
    advice?: string;
}

export interface Recall {
    component: string;
    summary: string;
    date: string;
}

export interface ComponentIssue {
    component: string;
    count: number;
    hasCrashes: boolean;
    hasFires: boolean;
    hasInjuries: boolean;
    sampleComplaints: string[];
}

export interface MaintenanceItemApi {
    id: string;
    name: string;
    component: string;
    category: string;
    severity: 'critical' | 'major' | 'moderate' | 'minor';
    description: string;
    warningSymptoms?: string[];
}

export interface MaintenanceProjectionApi {
    item: MaintenanceItemApi;
    urgency: 'past_due' | 'due_now' | 'upcoming';
    milesUntilDue: number;
    progressThroughWindow: number;
    adjustedCostLow: number;
    adjustedCostHigh: number;
}

export interface MaintenanceCostSummaryApi {
    projections: MaintenanceProjectionApi[];
    pastDueCount: number;
    dueNowCount: number;
    upcomingCount: number;
    immediateRepairCostLow: number;
    immediateRepairCostHigh: number;
    upcomingCostLow: number;
    upcomingCostHigh: number;
    maintenanceHealthScore: number;
}

export interface AIConcern {
    issue: string;
    severity: string;
    explanation: string;
}

export interface AIAnalysis {
    trustworthiness: number;
    impression: string;
    concerns: AIConcern[];
}

export interface Recommendation {
    verdict: 'BUY' | 'MAYBE' | 'PASS';
    confidence: number;
    summary: string;
    questionsForSeller: string[];
}

// Safety Ratings from NHTSA crash tests
export interface SafetyRating {
    overallRating: string;
    frontalCrashRating: string;
    sideCrashRating: string;
    rolloverRating: string;
    // Individual component ratings (when overall is "Not Rated")
    frontCrashDriversideRating?: string;
    frontCrashPassengersideRating?: string;
    sideCrashDriversideRating?: string;
    sideCrashPassengersideRating?: string;
    complaintsCount: number;
    recallsCount: number;
}

// Known issues derived from NHTSA complaints
export interface KnownIssue {
    component: string;
    severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
    complaintCount: number;
    description: string;
    hasSafetyIncidents: boolean;
    sampleComplaints: string[];  // 2-3 actual complaint summaries from NHTSA
}

// Survival Analysis types (Weibull-based probability model)
export type SurvivalRiskLevel = 'safe' | 'moderate' | 'risky' | 'unlikely';

export interface SurvivalMilestone {
    additionalMiles: number;
    totalMiles: number;
    probability: number;  // 0-1
    riskLevel: SurvivalRiskLevel;
}

export interface SurvivalAnalysis {
    milestones: SurvivalMilestone[];
    expectedAdditionalMiles: number;  // Median (50th percentile)
    confidenceRange: { low: number; high: number };  // 25th-75th percentile
    modelConfidence: 'high' | 'medium' | 'low';
    warnings: string[];
}

export interface AnalysisResponse {
    success: boolean;
    error?: string;
    details?: unknown;
    vehicle?: Vehicle;
    scores?: Scores;
    longevity?: Longevity | null;
    lifespanAnalysis?: LifespanAnalysis;
    reliabilityAnalysis?: ReliabilityAnalysis;
    pricing?: Pricing | null;
    knownIssues?: KnownIssue[];
    componentIssues?: ComponentIssue[];
    maintenanceCost?: MaintenanceCostSummaryApi;
    recalls?: Recall[];
    redFlags?: RedFlag[];
    aiAnalysis?: AIAnalysis;
    recommendation?: Recommendation;
    safetyRating?: SafetyRating | null;
    // New features
    negotiationStrategy?: NegotiationStrategy;
    maintenanceCosts?: MaintenanceCostEstimate;
    inspectionChecklist?: InspectionChecklist;
    warrantyValue?: WarrantyValueResult;
    priceThresholds?: PriceThresholds;
    survivalAnalysis?: SurvivalAnalysis;
}

export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public details?: unknown,
        public isRetryable: boolean = false
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export class NetworkError extends APIError {
    constructor(message: string = 'Network error. Please check your connection and try again.') {
        super(message, 0, undefined, true);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends APIError {
    constructor(message: string = 'Request timed out. Please try again.') {
        super(message, 408, undefined, true);
        this.name = 'TimeoutError';
    }
}

// User-friendly error messages
const ERROR_MESSAGES: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please sign in to analyze vehicles.',
    403: 'Free analysis limit reached. Upgrade to Premium for unlimited access.',
    404: 'Vehicle not found. Please verify the VIN.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
};

function getErrorMessage(status: number, defaultMessage: string): string {
    return ERROR_MESSAGES[status] || defaultMessage;
}

async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = 30000
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new TimeoutError();
            }
            if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
                throw new NetworkError();
            }
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function analyzeByVin(data: VinAnalysisRequest): Promise<AnalysisResponse> {
    try {
        const response = await fetchWithTimeout('/api/analyze/vin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        let result: AnalysisResponse;
        try {
            result = await response.json();
        } catch {
            throw new APIError('Invalid response from server', response.status);
        }

        if (!response.ok || !result.success) {
            const message = result.error || getErrorMessage(response.status, 'Failed to analyze VIN');
            const isRetryable = [429, 500, 503].includes(response.status);
            throw new APIError(message, response.status, result.details, isRetryable);
        }

        return result;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new NetworkError();
    }
}

export async function analyzeByListing(data: ListingAnalysisRequest): Promise<AnalysisResponse> {
    try {
        const response = await fetchWithTimeout('/api/analyze/listing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }, 60000); // Longer timeout for AI analysis

        let result: AnalysisResponse;
        try {
            result = await response.json();
        } catch {
            throw new APIError('Invalid response from server', response.status);
        }

        if (!response.ok || !result.success) {
            const message = result.error || getErrorMessage(response.status, 'Failed to analyze listing');
            const isRetryable = [429, 500, 503].includes(response.status);
            throw new APIError(message, response.status, result.details, isRetryable);
        }

        return result;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new NetworkError();
    }
}

// Vehicle History Types and API
export interface VehicleHistory {
    vin: string;
    titleRecords: Array<{
        state: string;
        date: string;
        brand?: string;
    }>;
    titleBrands: string[];
    odometerRecords: Array<{
        date: string;
        reading: number;
        source?: string;
    }>;
    odometerDiscrepancy: boolean;
    theftRecord: boolean;
    totalLoss: boolean;
    fetchedAt: Date;
}

export interface HistoryAnalysis {
    hasCriticalIssue: boolean;
    hasHighRiskIssue: boolean;
    issues: Array<{
        type: string;
        severity: 'critical' | 'high' | 'medium';
        description: string;
    }>;
    recommendation: string;
}

export interface VehicleHistoryResponse {
    success: boolean;
    history?: VehicleHistory;
    analysis?: HistoryAnalysis;
    error?: string;
    cached?: boolean;
    remainingCalls?: number;
    featureAvailable?: boolean;
}

export async function fetchVehicleHistory(vin: string): Promise<VehicleHistoryResponse> {
    try {
        const response = await fetchWithTimeout(`/api/history/${encodeURIComponent(vin)}`, {
            method: 'GET',
        });

        const result: VehicleHistoryResponse = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || getErrorMessage(response.status, 'Failed to fetch vehicle history'),
            };
        }

        return result;
    } catch (error) {
        if (error instanceof APIError) {
            return {
                success: false,
                error: error.message,
            };
        }
        return {
            success: false,
            error: 'Network error. Please check your connection.',
        };
    }
}

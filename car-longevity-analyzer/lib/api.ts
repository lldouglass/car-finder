// API Types based on route responses

export interface VinAnalysisRequest {
    vin: string;
    mileage: number;
    askingPrice: number;
    listingText?: string;
}

export interface ListingAnalysisRequest {
    listingText: string;
    askingPrice?: number;
    mileage?: number;
}

export interface Vehicle {
    vin?: string;
    year: number | null;
    make: string | null;
    model: string | null;
    trim?: string | null;
}

export interface Scores {
    reliability: number | null;
    longevity: number | null;
    priceValue: number | null;
    safety: number | null;
    overall: number | null;
}

export interface SafetyBreakdown {
    crashTestRatings: {
        overall: number | null;
        frontal: number | null;
        side: number | null;
        rollover: number | null;
    };
    incidents: {
        deaths: number;
        injuries: number;
        fires: number;
        crashes: number;
    };
    crashTestScore: number | null;
    incidentScore: number;
}

export interface SafetyResult {
    score: number;
    breakdown: SafetyBreakdown;
    confidence: 'high' | 'medium' | 'low';
    hasCrashTestData: boolean;
}

export interface Longevity {
    estimatedRemainingMiles: number;
    remainingYears: number;
    percentUsed: number;
}

export interface Pricing {
    askingPrice: number;
    fairPriceLow: number;
    fairPriceHigh: number;
    dealQuality: 'GREAT' | 'GOOD' | 'FAIR' | 'HIGH' | 'OVERPRICED';
    analysis: string;
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
    complaintCount: number;
    severityScore: number;
    description: string;
}

export interface AIConcern {
    issue: string;
    severity: string;
    explanation: string;
}

export interface AIInconsistency {
    type: string;
    description: string;
    severity: string;
    details: string;
}

export interface AISuspiciousPattern {
    type: string;
    phrase: string;
    explanation: string;
    severity: string;
}

export interface AIAnalysis {
    trustworthiness: number;
    impression: string;
    concerns: AIConcern[];
    inconsistencies?: AIInconsistency[];
    suspiciousPatterns?: AISuspiciousPattern[];
}

export interface Recommendation {
    verdict: 'BUY' | 'MAYBE' | 'PASS';
    confidence: number;
    summary: string;
    questionsForSeller: string[];
}

// Vehicle History Types (VinAudit/NMVTIS)
export interface TitleRecord {
    state: string;
    date: string;
    odometer: number;
    titleType: string;
}

export interface OdometerRecord {
    date: string;
    reading: number;
    source?: string;
}

export interface VehicleHistory {
    vin: string;
    titleRecords: TitleRecord[];
    titleBrands: string[];
    odometerRecords: OdometerRecord[];
    odometerDiscrepancy: boolean;
    theftRecord: boolean;
    totalLoss: boolean;
    fetchedAt: string;
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
    cached?: boolean;
    remainingCalls?: number;
    error?: string;
    featureAvailable?: boolean;
}

export interface AnalysisResponse {
    success: boolean;
    error?: string;
    details?: unknown;
    vehicle?: Vehicle;
    scores?: Scores;
    longevity?: Longevity | null;
    pricing?: Pricing | null;
    safety?: SafetyResult | null;
    knownIssues?: string[];
    componentIssues?: ComponentIssue[];
    recalls?: Recall[];
    redFlags?: RedFlag[];
    aiAnalysis?: AIAnalysis;
    recommendation?: Recommendation;
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

/**
 * Fetches vehicle history (NMVTIS data) for a VIN.
 * This is a paid feature - each lookup costs $1-2.
 */
export async function fetchVehicleHistory(vin: string): Promise<VehicleHistoryResponse> {
    try {
        const response = await fetchWithTimeout(`/api/history/${encodeURIComponent(vin)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        const result: VehicleHistoryResponse = await response.json();

        if (!response.ok || !result.success) {
            // Return the error response without throwing (let caller handle)
            return result;
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
            error: 'Network error. Please check your connection and try again.',
        };
    }
}

/**
 * Checks if vehicle history lookup is available.
 */
export async function isHistoryLookupAvailable(): Promise<boolean> {
    try {
        const response = await fetch('/api/history/check', {
            method: 'HEAD',
        });
        return response.headers.get('X-Feature-Available') === 'true';
    } catch {
        return false;
    }
}

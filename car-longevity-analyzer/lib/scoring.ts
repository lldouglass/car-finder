import { getReliabilityData } from './reliability-data';
import {
    SCORE_WEIGHTS,
    RED_FLAG_PENALTIES,
    RECOMMENDATION_THRESHOLDS,
    VEHICLE_CONSTANTS
} from './constants';
import type { Complaint } from './nhtsa';

// Types for parameters
interface KnownIssue {
    severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
    description?: string;
}

// Component issue identified from NHTSA complaints
export interface ComponentIssue {
    component: string;
    complaintCount: number;
    severityScore: number;
    description: string;
}

interface LongevityResult {
    score: number;
    remainingMiles: number;
    remainingYears: number;
    percentUsed: number;
}

interface PriceResult {
    score: number;
    dealQuality: 'GREAT' | 'GOOD' | 'FAIR' | 'HIGH' | 'OVERPRICED';
    analysis: string;
}

interface OverallResult {
    score: number;
    recommendation: 'BUY' | 'MAYBE' | 'PASS';
    confidence: number;
    summary: string;
}

export interface PriceThresholds {
    buyThreshold: number | null;    // Price at which verdict becomes BUY
    maybeThreshold: number | null;  // Price at which verdict becomes MAYBE
    currentVerdict: 'BUY' | 'MAYBE' | 'PASS';
    priceImpact: string;           // Human-readable advice
}

interface RedFlag {
    severity: string;  // can be critical, high, medium, low
}

/**
 * Calculates reliability score based on make/model/year and known issues.
 */
export function calculateReliabilityScore(
    make: string,
    model: string,
    year: number,
    knownIssues: KnownIssue[]
): number {
    // 1. Get base score from data
    const data = getReliabilityData(make, model);
    let baseScore = data ? data.baseScore : 5.0; // Default to average if unknown

    // 2. Apply year-specific adjustments
    let yearAdjustment = 0;
    if (data?.yearsToAvoid.includes(year)) {
        yearAdjustment = -2.0;
    } else if (year >= 2018) {
        // Newer cars generally reliable (simplification)
        yearAdjustment = 0.5;
    }

    // 3. Deduct for known issues (capped to avoid excessive penalty from high-volume vehicles)
    // Popular vehicles will have more complaints simply due to sales volume
    const issuePenalty = Math.min(3.0, knownIssues.reduce((penalty, issue) => {
        switch (issue.severity) {
            case 'CRITICAL': return penalty + 1.0;
            case 'MAJOR': return penalty + 0.5;
            case 'MODERATE': return penalty + 0.2;
            case 'MINOR': return penalty + 0.05;
            default: return penalty;
        }
    }, 0));

    const finalScore = baseScore + yearAdjustment - issuePenalty;
    return Math.max(1, Math.min(10, finalScore));
}

// Severity weights for complaint-based scoring
const COMPLAINT_SEVERITY_WEIGHTS = {
    death: 50,
    injury: 20,
    crash: 10,
    fire: 15,
    default: 1
};

// Component name normalization mapping
const COMPONENT_NORMALIZATION: Record<string, string> = {
    'ENGINE': 'Engine',
    'ENGINE AND ENGINE COOLING': 'Engine',
    'POWER TRAIN': 'Transmission',
    'POWERTRAIN': 'Transmission',
    'VEHICLE SPEED CONTROL': 'Transmission',
    'ELECTRICAL SYSTEM': 'Electrical',
    'ELECTRICAL': 'Electrical',
    'AIR BAGS': 'Airbags',
    'SERVICE BRAKES': 'Brakes',
    'BRAKES': 'Brakes',
    'SERVICE BRAKES, HYDRAULIC': 'Brakes',
    'STEERING': 'Steering',
    'SUSPENSION': 'Suspension',
    'FUEL SYSTEM, GASOLINE': 'Fuel System',
    'FUEL SYSTEM': 'Fuel System',
    'STRUCTURE': 'Body/Structure',
    'VISIBILITY/WIPER': 'Visibility',
    'VISIBILITY': 'Visibility',
    'LIGHTING': 'Lighting',
    'WHEELS': 'Wheels/Tires',
    'TIRES': 'Wheels/Tires',
};

/**
 * Normalizes NHTSA component names to consistent categories.
 */
function normalizeComponent(component: string): string {
    const upper = component.toUpperCase().trim();
    // Try direct match first
    if (COMPONENT_NORMALIZATION[upper]) {
        return COMPONENT_NORMALIZATION[upper];
    }
    // Try partial match
    for (const [key, value] of Object.entries(COMPONENT_NORMALIZATION)) {
        if (upper.includes(key) || key.includes(upper)) {
            return value;
        }
    }
    // Return original with title case
    return component.split(' ').map(w =>
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
}

/**
 * Calculates a weighted severity score for a single complaint.
 */
function getComplaintSeverityWeight(complaint: Complaint): number {
    if (complaint.Deaths > 0) return COMPLAINT_SEVERITY_WEIGHTS.death;
    if (complaint.Injuries > 0) return COMPLAINT_SEVERITY_WEIGHTS.injury;
    if (complaint.Fire) return COMPLAINT_SEVERITY_WEIGHTS.fire;
    if (complaint.Crash) return COMPLAINT_SEVERITY_WEIGHTS.crash;
    return COMPLAINT_SEVERITY_WEIGHTS.default;
}

/**
 * Calculates reliability score from NHTSA complaint data.
 * This provides a dynamic, data-driven reliability assessment.
 *
 * @param complaints - Array of NHTSA complaints
 * @param vehicleYear - Model year of the vehicle
 * @param fallbackScore - Score to blend with if complaints are sparse
 * @returns Reliability score from 1-10
 */
export function calculateReliabilityFromComplaints(
    complaints: Complaint[],
    vehicleYear: number,
    fallbackScore: number = 5.0
): number {
    // If no complaints, return a moderate-high score (lack of data, not necessarily reliable)
    if (!complaints || complaints.length === 0) {
        // Blend with fallback - unknown reliability leans toward average
        return Math.min(10, (fallbackScore + 6.5) / 2);
    }

    // Calculate weighted severity score
    let totalSeverityScore = 0;
    for (const complaint of complaints) {
        totalSeverityScore += getComplaintSeverityWeight(complaint);
    }

    // Normalize by vehicle age (older cars have more time to accumulate complaints)
    const currentYear = new Date().getFullYear();
    const vehicleAge = Math.max(1, currentYear - vehicleYear);
    const ageNormalizedScore = totalSeverityScore / vehicleAge;

    // Also consider raw complaint count (many complaints = concerning even if minor)
    const countPenalty = Math.log10(complaints.length + 1) * 2;

    // Combined raw score (higher = worse)
    const rawBadnessScore = ageNormalizedScore / 5 + countPenalty;

    // Convert to 1-10 scale (lower badness = higher score)
    // Calibration: 0-2 raw = 9-10 score, 10+ raw = 1-3 score
    const calculatedScore = Math.max(1, Math.min(10, 10 - rawBadnessScore));

    // If we have very few complaints (< 5), blend more heavily with fallback
    // since sparse data isn't conclusive
    if (complaints.length < 5) {
        const weight = complaints.length / 5; // 0 to 1
        return (calculatedScore * weight) + (fallbackScore * (1 - weight));
    }

    // Light blend with fallback to maintain some consistency with known reliability data
    return (calculatedScore * 0.7) + (fallbackScore * 0.3);
}

/**
 * Identifies specific component issues from NHTSA complaint data.
 * Returns the top problem areas based on complaint frequency and severity.
 *
 * @param complaints - Array of NHTSA complaints
 * @param limit - Maximum number of issues to return
 * @returns Array of component issues sorted by severity
 */
export function identifyComponentIssues(
    complaints: Complaint[],
    limit: number = 3
): ComponentIssue[] {
    if (!complaints || complaints.length === 0) {
        return [];
    }

    // Group complaints by normalized component
    const componentMap = new Map<string, { count: number; severityScore: number; examples: string[] }>();

    for (const complaint of complaints) {
        const component = normalizeComponent(complaint.Component || 'Other');
        const existing = componentMap.get(component) || { count: 0, severityScore: 0, examples: [] };

        existing.count++;
        existing.severityScore += getComplaintSeverityWeight(complaint);

        // Store first few summaries as examples
        if (existing.examples.length < 2 && complaint.Summary) {
            const shortSummary = complaint.Summary.substring(0, 100);
            existing.examples.push(shortSummary);
        }

        componentMap.set(component, existing);
    }

    // Convert to array and sort by severity score
    const issues: ComponentIssue[] = [];
    for (const [component, data] of componentMap.entries()) {
        // Only include components with meaningful complaint counts
        if (data.count >= 2 || data.severityScore >= 10) {
            const description = generateComponentDescription(component, data.count, data.severityScore);
            issues.push({
                component,
                complaintCount: data.count,
                severityScore: data.severityScore,
                description
            });
        }
    }

    // Sort by severity score descending
    issues.sort((a, b) => b.severityScore - a.severityScore);

    return issues.slice(0, limit);
}

/**
 * Generates a human-readable description for a component issue.
 */
function generateComponentDescription(
    component: string,
    count: number,
    severityScore: number
): string {
    const severityLevel =
        severityScore > 50 ? 'Serious' :
        severityScore > 20 ? 'Notable' : 'Minor';

    const countText =
        count >= 50 ? 'Many' :
        count >= 20 ? 'Multiple' :
        count >= 5 ? 'Several' : 'Some';

    return `${severityLevel} ${component.toLowerCase()} issues reported (${count} complaints)`;
}

/**
 * Calculates longevity score based on mileage and expected lifespan.
 */
export function calculateLongevityScore(
    expectedLifespan: number, // e.g., 250000
    currentMileage: number,   // e.g., 120000
    annualMiles: number = VEHICLE_CONSTANTS.avgMilesPerYear
): LongevityResult {
    // Guard against invalid inputs
    if (expectedLifespan <= 0 || !Number.isFinite(expectedLifespan)) {
        return { score: 5, remainingMiles: 0, remainingYears: 0, percentUsed: 100 };
    }
    if (currentMileage < 0 || !Number.isFinite(currentMileage)) {
        currentMileage = 0;
    }
    if (annualMiles <= 0 || !Number.isFinite(annualMiles)) {
        annualMiles = VEHICLE_CONSTANTS.avgMilesPerYear;
    }

    const remainingMiles = Math.max(0, expectedLifespan - currentMileage);
    const percentUsed = (currentMileage / expectedLifespan) * 100;
    const percentRemaining = 100 - percentUsed;

    // Convert to 1-10 scale (100% remaining = 10, 0% = 1)
    const score = 1 + (percentRemaining / 100) * 9;

    return {
        score: Math.round(Math.max(1, Math.min(10, score)) * 10) / 10,
        remainingMiles,
        remainingYears: Math.round(remainingMiles / annualMiles),
        percentUsed: Math.round(Math.min(100, percentUsed)),
    };
}

/**
 * Calculates price score based on asking price vs fair market range.
 */
export function calculatePriceScore(
    askingPrice: number,
    fairPriceLow: number,
    fairPriceHigh: number
): PriceResult {
    // Guard against invalid inputs
    if (!Number.isFinite(askingPrice) || askingPrice < 0) {
        return { score: 5, dealQuality: 'FAIR', analysis: 'Unable to calculate price score.' };
    }
    if (!Number.isFinite(fairPriceLow) || fairPriceLow <= 0) {
        fairPriceLow = 1000; // Fallback minimum
    }
    if (!Number.isFinite(fairPriceHigh) || fairPriceHigh <= 0) {
        fairPriceHigh = fairPriceLow * 1.2;
    }

    // Ensure low <= high
    if (fairPriceLow > fairPriceHigh) {
        [fairPriceLow, fairPriceHigh] = [fairPriceHigh, fairPriceLow];
    }

    const range = fairPriceHigh - fairPriceLow;

    let score = 5;

    if (askingPrice < fairPriceLow) {
        // Better than low price - Max score 10 at 85% of low price
        const discount = (fairPriceLow - askingPrice) / fairPriceLow;
        score = 7 + (discount / 0.15) * 3;
    } else if (askingPrice > fairPriceHigh) {
        // Worse than high price - Min score 1 at 120% of high price
        const premium = (askingPrice - fairPriceHigh) / fairPriceHigh;
        score = 4 - (premium / 0.2) * 3;
    } else if (range > 0) {
        // Inside range (4 to 7) - Linear interpolation
        const position = (askingPrice - fairPriceLow) / range;
        score = 7 - (position * 3);
    } else {
        // Range is zero (low === high), score based on match
        score = askingPrice === fairPriceLow ? 7 : 5;
    }

    score = Math.max(1, Math.min(10, score));

    // Determine deal quality
    let dealQuality: PriceResult['dealQuality'];
    if (askingPrice < fairPriceLow * 0.90) dealQuality = 'GREAT';
    else if (askingPrice < fairPriceLow) dealQuality = 'GOOD';
    else if (askingPrice <= fairPriceHigh) dealQuality = 'FAIR';
    else if (askingPrice <= fairPriceHigh * 1.15) dealQuality = 'HIGH';
    else dealQuality = 'OVERPRICED';

    const generatePriceAnalysis = (pct: number, quality: string) => {
        if (quality === 'GREAT' || quality === 'GOOD') return `Price is competitive.`;
        if (quality === 'FAIR') return `Price is within fair market range.`;
        return `Price is above market average.`;
    }

    return {
        score: Math.round(score * 10) / 10,
        dealQuality,
        analysis: generatePriceAnalysis(0, dealQuality),
    };
}

/**
 * Calculates overall weighted score and recommendation.
 * @param safety - Optional safety score (1-10). If not provided, weight is redistributed.
 */
export function calculateOverallScore(
    reliability: number,
    longevity: number,
    price: number,
    redFlags: RedFlag[],
    safety?: number | null
): OverallResult {
    // Validate inputs
    reliability = Number.isFinite(reliability) ? Math.max(1, Math.min(10, reliability)) : 5;
    longevity = Number.isFinite(longevity) ? Math.max(1, Math.min(10, longevity)) : 5;
    price = Number.isFinite(price) ? Math.max(1, Math.min(10, price)) : 5;

    // Weighted average using constants
    let baseScore: number;

    if (safety !== null && safety !== undefined && Number.isFinite(safety)) {
        // Include safety in weighted calculation
        safety = Math.max(1, Math.min(10, safety));
        baseScore = (
            reliability * SCORE_WEIGHTS.reliability +
            longevity * SCORE_WEIGHTS.longevity +
            price * SCORE_WEIGHTS.price +
            safety * SCORE_WEIGHTS.safety
        );
    } else {
        // Redistribute safety weight proportionally to other scores
        const weightWithoutSafety = SCORE_WEIGHTS.reliability + SCORE_WEIGHTS.longevity + SCORE_WEIGHTS.price;
        baseScore = (
            reliability * (SCORE_WEIGHTS.reliability / weightWithoutSafety) +
            longevity * (SCORE_WEIGHTS.longevity / weightWithoutSafety) +
            price * (SCORE_WEIGHTS.price / weightWithoutSafety)
        );
    }

    // Red flag penalties using constants
    const hasCriticalRedFlag = redFlags.some(f => f.severity.toLowerCase() === 'critical');
    const hasHighRedFlag = redFlags.some(f => f.severity.toLowerCase() === 'high');
    const mediumLowFlags = redFlags.filter(f =>
        f.severity.toLowerCase() === 'medium' || f.severity.toLowerCase() === 'low'
    ).length;

    let penalty = 0;
    if (hasCriticalRedFlag) penalty += RED_FLAG_PENALTIES.critical;
    if (hasHighRedFlag) penalty += RED_FLAG_PENALTIES.high;
    penalty += mediumLowFlags * RED_FLAG_PENALTIES.medium;

    const finalScore = Math.max(1, baseScore - penalty);

    // Determine recommendation using constants
    let recommendation: OverallResult['recommendation'];

    if (hasCriticalRedFlag || finalScore < 3.0) {
        recommendation = 'PASS';
    } else if (finalScore >= RECOMMENDATION_THRESHOLDS.buy) {
        recommendation = 'BUY';
    } else if (finalScore >= RECOMMENDATION_THRESHOLDS.maybe) {
        recommendation = 'MAYBE';
    } else {
        recommendation = 'PASS';
    }

    // Confidence based on data completeness
    const hasAllScores = [reliability, longevity, price].every(s => s !== 5);
    const confidence = hasAllScores ? 0.85 : 0.65;

    const generateSummary = (rec: string, r: number, l: number, p: number) => {
        if (rec === 'PASS') return `Pass on this vehicle due to low overall score or critical issues.`;
        return `Rated ${rec} based on Reliability(${r.toFixed(1)}), Longevity(${l.toFixed(1)}), and Price(${p.toFixed(1)}).`;
    };

    return {
        score: Math.round(finalScore * 10) / 10,
        recommendation,
        confidence,
        summary: generateSummary(recommendation, reliability, longevity, price),
    };
}

/**
 * Calculates price thresholds that would change the verdict.
 * Works backwards from target overall scores to find what price score is needed,
 * then converts that to an actual dollar amount.
 */
export function calculatePriceThresholds(
    currentPrice: number,
    fairPriceLow: number,
    fairPriceHigh: number,
    reliabilityScore: number,
    longevityScore: number,
    safetyScore: number | null,
    redFlags: RedFlag[],
    currentVerdict: 'BUY' | 'MAYBE' | 'PASS'
): PriceThresholds {
    // Calculate red flag penalty (same logic as calculateOverallScore)
    const hasCriticalRedFlag = redFlags.some(f => f.severity.toLowerCase() === 'critical');
    const hasHighRedFlag = redFlags.some(f => f.severity.toLowerCase() === 'high');
    const mediumLowFlags = redFlags.filter(f =>
        f.severity.toLowerCase() === 'medium' || f.severity.toLowerCase() === 'low'
    ).length;

    let penalty = 0;
    if (hasCriticalRedFlag) penalty += RED_FLAG_PENALTIES.critical;
    if (hasHighRedFlag) penalty += RED_FLAG_PENALTIES.high;
    penalty += mediumLowFlags * RED_FLAG_PENALTIES.medium;

    // If critical red flag, no price can make this a BUY
    if (hasCriticalRedFlag) {
        return {
            buyThreshold: null,
            maybeThreshold: null,
            currentVerdict,
            priceImpact: 'Critical issues prevent this from being recommended at any price.'
        };
    }

    // Calculate base score without price
    let baseScoreWithoutPrice: number;
    let priceWeight: number;

    if (safetyScore !== null && Number.isFinite(safetyScore)) {
        // With safety score
        const otherWeights = SCORE_WEIGHTS.reliability + SCORE_WEIGHTS.longevity + SCORE_WEIGHTS.safety;
        baseScoreWithoutPrice = (
            reliabilityScore * SCORE_WEIGHTS.reliability +
            longevityScore * SCORE_WEIGHTS.longevity +
            safetyScore * SCORE_WEIGHTS.safety
        );
        priceWeight = SCORE_WEIGHTS.price;
    } else {
        // Without safety score (redistribute weights)
        const weightWithoutSafety = SCORE_WEIGHTS.reliability + SCORE_WEIGHTS.longevity + SCORE_WEIGHTS.price;
        const reliabilityWeight = SCORE_WEIGHTS.reliability / weightWithoutSafety;
        const longevityWeight = SCORE_WEIGHTS.longevity / weightWithoutSafety;
        priceWeight = SCORE_WEIGHTS.price / weightWithoutSafety;
        baseScoreWithoutPrice = (
            reliabilityScore * reliabilityWeight +
            longevityScore * longevityWeight
        ) * weightWithoutSafety / (1 - priceWeight);
    }

    // Function to find price for a target overall score
    const findPriceForScore = (targetScore: number): number | null => {
        // targetScore = baseScoreWithoutPrice + priceScore * priceWeight - penalty
        // priceScore * priceWeight = targetScore - baseScoreWithoutPrice + penalty
        // priceScore = (targetScore - baseScoreWithoutPrice + penalty) / priceWeight
        const requiredPriceScore = (targetScore + penalty - baseScoreWithoutPrice) / priceWeight;

        // Price score is clamped 1-10
        if (requiredPriceScore > 10) return null; // Impossible
        if (requiredPriceScore < 1) return null;  // Already achieved at any price

        // Convert price score back to actual price
        // Score 7+ means price <= fairPriceLow
        // Score 7 = at fairPriceLow
        // Score 4 = at fairPriceHigh
        // Score 10 = at 85% of fairPriceLow
        // Score 1 = at 120% of fairPriceHigh
        if (requiredPriceScore >= 7) {
            // Price needs to be below fairPriceLow
            // score = 7 + (discount / 0.15) * 3
            // discount = (score - 7) * 0.15 / 3
            const discount = (requiredPriceScore - 7) * 0.15 / 3;
            return Math.round(fairPriceLow * (1 - discount));
        } else if (requiredPriceScore >= 4) {
            // Price is in fair range
            // score = 7 - (position * 3)
            // position = (7 - score) / 3
            const position = (7 - requiredPriceScore) / 3;
            const range = fairPriceHigh - fairPriceLow;
            return Math.round(fairPriceLow + position * range);
        } else {
            // Price is above fair range (score < 4)
            // This is already a bad deal, threshold not useful
            return null;
        }
    };

    const buyThreshold = findPriceForScore(RECOMMENDATION_THRESHOLDS.buy);
    const maybeThreshold = findPriceForScore(RECOMMENDATION_THRESHOLDS.maybe);

    // Generate human-readable advice
    let priceImpact: string;

    if (currentVerdict === 'BUY') {
        priceImpact = 'Already recommended. Great deal at current price.';
    } else if (currentVerdict === 'MAYBE') {
        if (buyThreshold !== null && buyThreshold < currentPrice) {
            const savings = currentPrice - buyThreshold;
            priceImpact = `At $${buyThreshold.toLocaleString()} or below, this becomes a BUY. Negotiate $${savings.toLocaleString()} off.`;
        } else if (buyThreshold !== null) {
            priceImpact = `Price would need to be $${buyThreshold.toLocaleString()} for a BUY recommendation.`;
        } else {
            priceImpact = 'Other factors (reliability, longevity) limit this vehicle regardless of price.';
        }
    } else { // PASS
        if (maybeThreshold !== null && maybeThreshold < currentPrice) {
            const savings = currentPrice - maybeThreshold;
            priceImpact = `At $${maybeThreshold.toLocaleString()} or below, this becomes worth considering. Currently ${Math.round((savings / currentPrice) * 100)}% overpriced.`;
        } else {
            priceImpact = 'Significant issues make this difficult to recommend at any realistic price.';
        }
    }

    return {
        buyThreshold,
        maybeThreshold,
        currentVerdict,
        priceImpact
    };
}

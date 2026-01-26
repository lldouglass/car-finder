import { getReliabilityData } from './reliability-data';
import {
    SCORE_WEIGHTS,
    RED_FLAG_PENALTIES,
    RECOMMENDATION_THRESHOLDS,
    VEHICLE_CONSTANTS
} from './constants';

// Types for parameters
interface KnownIssue {
    severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
    description?: string;
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

    // 3. Deduct for known issues
    const issuePenalty = knownIssues.reduce((penalty, issue) => {
        switch (issue.severity) {
            case 'CRITICAL': return penalty + 2.0;
            case 'MAJOR': return penalty + 1.2;
            case 'MODERATE': return penalty + 0.5;
            case 'MINOR': return penalty + 0.1;
            default: return penalty;
        }
    }, 0);

    const finalScore = baseScore + yearAdjustment - issuePenalty;
    return Math.max(1, Math.min(10, finalScore));
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
 */
export function calculateOverallScore(
    reliability: number,
    longevity: number,
    price: number,
    redFlags: RedFlag[]
): OverallResult {
    // Validate inputs
    reliability = Number.isFinite(reliability) ? Math.max(1, Math.min(10, reliability)) : 5;
    longevity = Number.isFinite(longevity) ? Math.max(1, Math.min(10, longevity)) : 5;
    price = Number.isFinite(price) ? Math.max(1, Math.min(10, price)) : 5;

    // Weighted average using constants
    const baseScore = (
        reliability * SCORE_WEIGHTS.reliability +
        longevity * SCORE_WEIGHTS.longevity +
        price * SCORE_WEIGHTS.price
    );

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

import { getReliabilityData } from './reliability-data';

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
    annualMiles: number = 12000
): LongevityResult {
    const remainingMiles = Math.max(0, expectedLifespan - currentMileage);
    const percentUsed = (currentMileage / expectedLifespan) * 100;
    const percentRemaining = 100 - percentUsed;

    // Convert to 1-10 scale (100% remaining = 10, 0% = 1)
    // Curve it slightly so even high mileage cars get some points if they run
    // But extremely high mileage should be low.
    const score = 1 + (percentRemaining / 100) * 9;

    return {
        score: Math.round(score * 10) / 10,
        remainingMiles,
        remainingYears: Math.round(remainingMiles / annualMiles),
        percentUsed: Math.round(percentUsed),
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
    const midpoint = (fairPriceLow + fairPriceHigh) / 2;
    const range = fairPriceHigh - fairPriceLow;

    // Deviation from midpoint (-1 = great deal, +1 = overpriced relative to range half-width)
    // Actually, let's look at the skill logic:
    // const deviation = (askingPrice - midpoint) / (range || 1);
    // The range might be small, so be careful.

    // Let's use percentage difference from fair price low for "Great" deals
    // and percentage above fair price high for "Overpriced"

    let score = 5;
    let deviation = 0;

    if (askingPrice < fairPriceLow) {
        // Better than low price
        // Max score 10 at 85% of low price
        const discount = (fairPriceLow - askingPrice) / fairPriceLow;
        score = 7 + (discount / 0.15) * 3;
    } else if (askingPrice > fairPriceHigh) {
        // Worse than high price
        // Min score 1 at 120% of high price
        const premium = (askingPrice - fairPriceHigh) / fairPriceHigh;
        score = 4 - (premium / 0.2) * 3;
    } else {
        // Inside range (4 to 7)
        // Linear interpolation between High(4) and Low(7)
        const position = (askingPrice - fairPriceLow) / (fairPriceHigh - fairPriceLow);
        score = 7 - (position * 3);
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
    // Weighted average (reliability and longevity weighted higher)
    // Reliability: 35%, Longevity: 35%, Price: 30%
    const baseScore = (
        reliability * 0.35 +
        longevity * 0.35 +
        price * 0.30
    );

    // Red flag penalties
    const redFlagCount = redFlags.length;
    // Assuming 'critical' red flags should pass immediately, typically handled by caller or severe penalty
    const hasCriticalRedFlag = redFlags.some(f => f.severity.toLowerCase() === 'critical');

    const penalty = (redFlagCount * 0.5) + (hasCriticalRedFlag ? 5.0 : 0); // stiffer penalty
    const finalScore = Math.max(1, baseScore - penalty);

    // Determine recommendation
    let recommendation: OverallResult['recommendation'];

    if (hasCriticalRedFlag || finalScore < 3.0) {
        recommendation = 'PASS';
    } else if (finalScore >= 7.5) {
        recommendation = 'BUY';
    } else if (finalScore >= 5.0) {
        recommendation = 'MAYBE';
    } else {
        recommendation = 'PASS';
    }

    // Confidence - placeholder logic
    const confidence = 0.85; // Static for now until we typically rely on data completeness

    const generateSummary = (rec: string, r: number, l: number, p: number) => {
        if (rec === 'PASS') return `Pass on this vehicle due to low overall score/issues.`;
        return `Rated ${rec} based on Reliability(${r.toFixed(1)}), Longevity(${l.toFixed(1)}), and Price(${p.toFixed(1)}).`;
    };

    return {
        score: Math.round(finalScore * 10) / 10,
        recommendation,
        confidence,
        summary: generateSummary(recommendation, reliability, longevity, price),
    };
}

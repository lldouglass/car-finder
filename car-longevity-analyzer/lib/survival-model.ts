/**
 * Survival Model for Vehicle Longevity Analysis
 *
 * Uses Weibull distribution to calculate the probability of a vehicle
 * reaching various mileage milestones. The Weibull distribution is standard
 * in reliability engineering for modeling failure times.
 *
 * Conditional Survival Formula:
 * S(x | current) = exp(-((current + x) / λ)^k) / exp(-(current / λ)^k)
 *
 * Where:
 * - λ (lambda) = scale parameter = adjusted lifespan from existing system
 * - k = shape parameter = determines failure curve shape (typically 2.5-4.0)
 * - x = additional miles from current mileage
 */

import type { LifespanFactors, KnownIssueForLifespan } from './lifespan-factors';

// === Type Definitions ===

export type RiskLevel = 'safe' | 'moderate' | 'risky' | 'unlikely';

export interface SurvivalMilestone {
    additionalMiles: number;
    totalMiles: number;
    probability: number;  // 0-1
    riskLevel: RiskLevel;
}

export interface SurvivalAnalysis {
    milestones: SurvivalMilestone[];
    expectedAdditionalMiles: number;  // Median (50th percentile)
    confidenceRange: { low: number; high: number };  // 25th-75th percentile
    modelConfidence: 'high' | 'medium' | 'low';
    warnings: string[];
}

export interface SurvivalInput {
    currentMileage: number;
    vehicleAge: number;  // in years
    adjustedLifespan: number;  // from existing lifespan calculation (λ)
    baseReliabilityScore: number;  // 1-10 scale
    knownIssues: KnownIssueForLifespan[];
    factors: LifespanFactors;
    lifespanConfidence: 'high' | 'medium' | 'low';
}

// === Constants ===

const BASE_SHAPE_PARAMETER = 3.2;  // Typical for vehicles

// Shape parameter adjustments
const SHAPE_ADJUSTMENTS = {
    criticalKnownIssue: -1.2,     // More early failures (e.g., Theta II engine)
    majorKnownIssue: -0.5,        // Slightly flatter curve
    highReliability: 0.5,         // Steeper drop at end of life (score >= 9)
    lowReliability: -0.3,         // More spread-out failures (score < 6.5)
    cvtTransmission: -0.2,        // Less predictable
    poorMaintenance: -0.3,        // More unpredictable
    survivorBias: 0.3,            // Proven reliable (age > 15, low relative mileage)
};

// Minimum shape parameter to keep distribution valid
const MIN_SHAPE_PARAMETER = 1.5;
const MAX_SHAPE_PARAMETER = 5.0;

// Miles thresholds for milestone selection
const MILESTONE_SETS = {
    veryLow: [5000, 10000, 15000, 20000, 25000],           // < 10k remaining
    low: [10000, 25000, 50000, 75000, 100000],             // 10-50k remaining
    criticalIssue: [25000, 50000, 75000, 100000, 125000, 150000],  // Has critical issue
    normal: [50000, 100000, 150000, 200000, 250000],       // Normal (50k+)
};

// === Core Weibull Functions ===

/**
 * Calculate Weibull survival probability (unconditional).
 * S(x) = exp(-(x/λ)^k)
 */
function weibullSurvivalRaw(miles: number, lambda: number, k: number): number {
    if (miles <= 0) return 1.0;
    if (lambda <= 0) return 0.0;
    return Math.exp(-Math.pow(miles / lambda, k));
}

/**
 * Calculate conditional survival probability.
 * Given that the vehicle has survived to currentMileage,
 * what's the probability it survives an additional additionalMiles?
 *
 * S(current + additional | current) = S(current + additional) / S(current)
 */
export function weibullConditionalSurvival(
    currentMileage: number,
    additionalMiles: number,
    lambda: number,
    k: number
): number {
    const survivalAtCurrent = weibullSurvivalRaw(currentMileage, lambda, k);
    const survivalAtFuture = weibullSurvivalRaw(currentMileage + additionalMiles, lambda, k);

    // Avoid division by zero - if already at very low survival, return 0
    if (survivalAtCurrent < 0.001) return 0;

    return survivalAtFuture / survivalAtCurrent;
}

/**
 * Calculate the additional miles at which survival probability drops to a given level.
 * Inverse of conditional survival.
 */
function additionalMilesAtProbability(
    currentMileage: number,
    targetProbability: number,
    lambda: number,
    k: number
): number {
    // S(current + x | current) = targetProbability
    // S(current + x) = targetProbability * S(current)
    // exp(-((current + x)/λ)^k) = targetProbability * exp(-(current/λ)^k)
    // -((current + x)/λ)^k = ln(targetProbability) - (current/λ)^k
    // ((current + x)/λ)^k = (current/λ)^k - ln(targetProbability)
    // (current + x)/λ = ((current/λ)^k - ln(targetProbability))^(1/k)
    // current + x = λ * ((current/λ)^k - ln(targetProbability))^(1/k)
    // x = λ * ((current/λ)^k - ln(targetProbability))^(1/k) - current

    if (targetProbability >= 1) return Infinity;
    if (targetProbability <= 0) return 0;

    const currentTerm = Math.pow(currentMileage / lambda, k);
    const logTerm = -Math.log(targetProbability);
    const innerSum = currentTerm + logTerm;

    const futureTotal = lambda * Math.pow(innerSum, 1 / k);
    const additional = futureTotal - currentMileage;

    return Math.max(0, additional);
}

// === Shape Parameter Calculation ===

/**
 * Calculate the Weibull shape parameter (k) based on vehicle characteristics.
 * Higher k = failures clustered at end of life (predictable)
 * Lower k = failures spread throughout lifespan (less predictable)
 */
export function calculateShapeParameter(input: SurvivalInput): number {
    let k = BASE_SHAPE_PARAMETER;

    // Adjust for known issues
    if (input.knownIssues.length > 0) {
        const hasCritical = input.knownIssues.some(i => i.severity === 'CRITICAL');
        const hasMajor = input.knownIssues.some(i => i.severity === 'MAJOR');

        if (hasCritical) {
            k += SHAPE_ADJUSTMENTS.criticalKnownIssue;
        } else if (hasMajor) {
            k += SHAPE_ADJUSTMENTS.majorKnownIssue;
        }
    }

    // Adjust for reliability score
    if (input.baseReliabilityScore >= 9.0) {
        k += SHAPE_ADJUSTMENTS.highReliability;
    } else if (input.baseReliabilityScore < 6.5) {
        k += SHAPE_ADJUSTMENTS.lowReliability;
    }

    // Adjust for CVT transmission
    if (input.factors.transmission === 'cvt') {
        k += SHAPE_ADJUSTMENTS.cvtTransmission;
    }

    // Adjust for poor maintenance
    if (input.factors.maintenance === 'poor') {
        k += SHAPE_ADJUSTMENTS.poorMaintenance;
    }

    // Survivor bias: old vehicle with relatively low mileage is proven reliable
    if (input.vehicleAge > 15) {
        const expectedMileagePerYear = 12000;
        const expectedMileage = input.vehicleAge * expectedMileagePerYear;
        if (input.currentMileage < expectedMileage * 0.7) {
            // Low mileage for age = survivor bonus
            k += SHAPE_ADJUSTMENTS.survivorBias;
        }
    }

    // Clamp to valid range
    return Math.max(MIN_SHAPE_PARAMETER, Math.min(MAX_SHAPE_PARAMETER, k));
}

// === Milestone Selection ===

/**
 * Select appropriate milestones based on estimated remaining life.
 */
function selectMilestones(
    estimatedRemaining: number,
    hasCriticalIssue: boolean
): number[] {
    if (hasCriticalIssue) {
        return MILESTONE_SETS.criticalIssue;
    }

    if (estimatedRemaining < 10000) {
        return MILESTONE_SETS.veryLow;
    }

    if (estimatedRemaining < 50000) {
        return MILESTONE_SETS.low;
    }

    return MILESTONE_SETS.normal;
}

/**
 * Map probability to risk level.
 */
function getRiskLevel(probability: number): RiskLevel {
    if (probability >= 0.80) return 'safe';
    if (probability >= 0.50) return 'moderate';
    if (probability >= 0.20) return 'risky';
    return 'unlikely';
}

// === Main Function ===

/**
 * Calculate survival probabilities for a vehicle using Weibull distribution.
 */
export function calculateSurvivalProbabilities(input: SurvivalInput): SurvivalAnalysis {
    const warnings: string[] = [];

    // Handle edge case: vehicle past expected lifespan
    const percentUsed = (input.currentMileage / input.adjustedLifespan) * 100;
    const isPastExpected = percentUsed >= 100;

    if (isPastExpected) {
        warnings.push('Vehicle has exceeded its expected lifespan - predictions have higher uncertainty');
    }

    // Calculate shape parameter
    const k = calculateShapeParameter(input);

    // Use adjusted lifespan as scale parameter (λ)
    // For vehicles past expected lifespan, extend the scale to avoid immediate zero probabilities
    let lambda = input.adjustedLifespan;
    if (isPastExpected) {
        // Extend scale parameter for vehicles that have already exceeded expected life
        // They've proven themselves, so we give them more credit
        lambda = input.currentMileage * 1.2;  // Assume they might go 20% more
    }

    // Check for critical issues
    const hasCriticalIssue = input.knownIssues.some(i => i.severity === 'CRITICAL');

    // Estimate remaining miles for milestone selection
    const estimatedRemaining = Math.max(0, lambda - input.currentMileage);

    // Select appropriate milestones
    const milestoneMiles = selectMilestones(estimatedRemaining, hasCriticalIssue);

    // Calculate probabilities for each milestone
    const milestones: SurvivalMilestone[] = milestoneMiles.map(additionalMiles => {
        const probability = weibullConditionalSurvival(
            input.currentMileage,
            additionalMiles,
            lambda,
            k
        );

        return {
            additionalMiles,
            totalMiles: input.currentMileage + additionalMiles,
            probability: Math.round(probability * 1000) / 1000,  // Round to 3 decimal places
            riskLevel: getRiskLevel(probability),
        };
    });

    // Calculate expected additional miles (median = 50th percentile)
    const expectedAdditionalMiles = Math.round(
        additionalMilesAtProbability(input.currentMileage, 0.5, lambda, k)
    );

    // Calculate confidence range (25th-75th percentile)
    const lowConfidence = Math.round(
        additionalMilesAtProbability(input.currentMileage, 0.75, lambda, k)
    );
    const highConfidence = Math.round(
        additionalMilesAtProbability(input.currentMileage, 0.25, lambda, k)
    );

    // Determine model confidence based on input data quality
    let modelConfidence: 'high' | 'medium' | 'low';

    if (isPastExpected) {
        modelConfidence = 'low';
    } else if (input.lifespanConfidence === 'low') {
        modelConfidence = 'low';
        warnings.push('Limited information available - predictions may be less accurate');
    } else if (input.lifespanConfidence === 'medium' || hasCriticalIssue) {
        modelConfidence = 'medium';
    } else {
        modelConfidence = 'high';
    }

    // Add warnings for specific conditions
    if (hasCriticalIssue) {
        warnings.push('Vehicle has a critical known issue that significantly affects reliability');
    }

    if (input.factors.maintenance === 'poor') {
        warnings.push('Poor maintenance history increases failure risk');
    }

    return {
        milestones,
        expectedAdditionalMiles,
        confidenceRange: {
            low: lowConfidence,
            high: highConfidence,
        },
        modelConfidence,
        warnings,
    };
}

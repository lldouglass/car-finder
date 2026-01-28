/**
 * Safety scoring module - combines NHTSA crash test ratings with complaint-based incident data
 */

import type { SafetyRating, Complaint } from './nhtsa';
import { SAFETY_THRESHOLDS } from './constants';

// Crash test category weights
const CRASH_TEST_WEIGHTS = {
    frontal: 0.35,
    side: 0.30,
    rollover: 0.20,
    overall: 0.15,
} as const;

// Incident severity weights (for penalty calculation)
const INCIDENT_WEIGHTS = {
    death: 100,
    injury: 25,
    fire: 20,
    crash: 10,
} as const;

export interface SafetyBreakdown {
    // Crash test ratings (1-5 stars, null if not available)
    crashTestRatings: {
        overall: number | null;
        frontal: number | null;
        side: number | null;
        rollover: number | null;
    };
    // Incident counts from complaints
    incidents: {
        deaths: number;
        injuries: number;
        fires: number;
        crashes: number;
    };
    // Calculated scores
    crashTestScore: number | null;  // 1-10, null if no crash test data
    incidentScore: number;          // 1-10, based on complaint data
}

export interface SafetyResult {
    score: number;                  // Combined safety score (1-10)
    breakdown: SafetyBreakdown;
    confidence: 'high' | 'medium' | 'low';
    hasCrashTestData: boolean;
}

export interface SafetyRedFlag {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    advice?: string;
}

/**
 * Parses NHTSA star rating string to number (handles "Not Rated", etc.)
 */
function parseStarRating(rating: string | undefined): number | null {
    if (!rating || rating === 'Not Rated' || rating === '') {
        return null;
    }
    const parsed = parseInt(rating, 10);
    return isNaN(parsed) || parsed < 1 || parsed > 5 ? null : parsed;
}

/**
 * Calculates crash test score from NHTSA safety ratings (1-10 scale)
 */
function calculateCrashTestScore(ratings: SafetyBreakdown['crashTestRatings']): number | null {
    const scores: { weight: number; value: number }[] = [];

    if (ratings.frontal !== null) {
        scores.push({ weight: CRASH_TEST_WEIGHTS.frontal, value: ratings.frontal });
    }
    if (ratings.side !== null) {
        scores.push({ weight: CRASH_TEST_WEIGHTS.side, value: ratings.side });
    }
    if (ratings.rollover !== null) {
        scores.push({ weight: CRASH_TEST_WEIGHTS.rollover, value: ratings.rollover });
    }
    if (ratings.overall !== null) {
        scores.push({ weight: CRASH_TEST_WEIGHTS.overall, value: ratings.overall });
    }

    if (scores.length === 0) {
        return null;
    }

    // Normalize weights to sum to 1
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedAvg = scores.reduce((sum, s) => sum + (s.value * s.weight / totalWeight), 0);

    // Convert 5-star scale to 10-point scale (1 star = 2, 5 stars = 10)
    return Math.round(weightedAvg * 2 * 10) / 10;
}

/**
 * Calculates incident score from complaint data (1-10 scale, higher = safer)
 */
function calculateIncidentScore(
    incidents: SafetyBreakdown['incidents'],
    vehicleAge: number
): number {
    // Calculate weighted penalty
    const rawPenalty =
        incidents.deaths * INCIDENT_WEIGHTS.death +
        incidents.injuries * INCIDENT_WEIGHTS.injury +
        incidents.fires * INCIDENT_WEIGHTS.fire +
        incidents.crashes * INCIDENT_WEIGHTS.crash;

    // Normalize by vehicle age (older vehicles accumulate more incidents)
    const normalizedPenalty = rawPenalty / Math.max(1, vehicleAge);

    // Convert to 1-10 scale using logarithmic scaling
    // 0 penalty = 10, high penalty = approaches 1
    // Calibration: 50 normalized penalty = score of 5
    const score = 10 - Math.log10(normalizedPenalty + 1) * 3;

    return Math.round(Math.max(1, Math.min(10, score)) * 10) / 10;
}

/**
 * Aggregates incident counts from complaint data
 */
function aggregateIncidents(complaints: Complaint[]): SafetyBreakdown['incidents'] {
    return complaints.reduce(
        (acc, complaint) => ({
            deaths: acc.deaths + (complaint.Deaths || 0),
            injuries: acc.injuries + (complaint.Injuries || 0),
            fires: acc.fires + (complaint.Fire ? 1 : 0),
            crashes: acc.crashes + (complaint.Crash ? 1 : 0),
        }),
        { deaths: 0, injuries: 0, fires: 0, crashes: 0 }
    );
}

/**
 * Main safety score calculation function
 */
export function calculateSafetyScore(
    safetyRating: SafetyRating | null,
    complaints: Complaint[],
    vehicleYear: number
): SafetyResult {
    const currentYear = new Date().getFullYear();
    const vehicleAge = Math.max(1, currentYear - vehicleYear);

    // Parse crash test ratings
    const crashTestRatings = {
        overall: parseStarRating(safetyRating?.OverallRating),
        frontal: parseStarRating(safetyRating?.FrontalCrashRating),
        side: parseStarRating(safetyRating?.SideCrashRating),
        rollover: parseStarRating(safetyRating?.RolloverRating),
    };

    // Aggregate incident data from complaints
    const incidents = aggregateIncidents(complaints);

    // Calculate component scores
    const crashTestScore = calculateCrashTestScore(crashTestRatings);
    const incidentScore = calculateIncidentScore(incidents, vehicleAge);

    const hasCrashTestData = crashTestScore !== null;

    // Combine scores
    let finalScore: number;
    let confidence: 'high' | 'medium' | 'low';

    if (hasCrashTestData) {
        // 60% crash test + 40% incident score
        finalScore = crashTestScore * 0.6 + incidentScore * 0.4;
        confidence = complaints.length >= 10 ? 'high' : 'medium';
    } else {
        // 100% incident score with lower confidence
        finalScore = incidentScore;
        confidence = complaints.length >= 20 ? 'medium' : 'low';
    }

    return {
        score: Math.round(Math.max(1, Math.min(10, finalScore)) * 10) / 10,
        breakdown: {
            crashTestRatings,
            incidents,
            crashTestScore,
            incidentScore,
        },
        confidence,
        hasCrashTestData,
    };
}

/**
 * Detects safety-specific red flags from safety data
 */
export function detectSafetyRedFlags(
    safetyResult: SafetyResult,
    complaints: Complaint[]
): SafetyRedFlag[] {
    const flags: SafetyRedFlag[] = [];
    const { breakdown } = safetyResult;

    // Critical: Any deaths reported
    if (breakdown.incidents.deaths > 0) {
        flags.push({
            type: 'safety_fatalities',
            severity: 'critical',
            message: `${breakdown.incidents.deaths} death(s) reported in NHTSA complaints for this vehicle`,
            advice: 'Research specific incidents and consider if safety features have been updated since.',
        });
    }

    // High: Multiple injuries reported
    if (breakdown.incidents.injuries >= SAFETY_THRESHOLDS.highInjuryCount) {
        flags.push({
            type: 'safety_injuries',
            severity: 'high',
            message: `${breakdown.incidents.injuries} injury(ies) reported in NHTSA complaints`,
            advice: 'Ask about any safety-related repairs or updates made to this vehicle.',
        });
    } else if (breakdown.incidents.injuries > 0) {
        flags.push({
            type: 'safety_injuries',
            severity: 'medium',
            message: `${breakdown.incidents.injuries} injury(ies) reported in NHTSA complaints`,
        });
    }

    // High: Multiple fires reported
    if (breakdown.incidents.fires >= SAFETY_THRESHOLDS.highFireCount) {
        flags.push({
            type: 'safety_fires',
            severity: 'high',
            message: `${breakdown.incidents.fires} fire(s) reported for this vehicle model`,
            advice: 'Check for recalls related to fire hazards and ensure they have been addressed.',
        });
    } else if (breakdown.incidents.fires > 0) {
        flags.push({
            type: 'safety_fires',
            severity: 'medium',
            message: `${breakdown.incidents.fires} fire(s) reported for this vehicle model`,
        });
    }

    // Medium: Poor crash test rating
    if (breakdown.crashTestRatings.overall !== null &&
        breakdown.crashTestRatings.overall <= SAFETY_THRESHOLDS.poorCrashRating) {
        flags.push({
            type: 'safety_crash_rating',
            severity: 'medium',
            message: `Low overall NHTSA crash test rating (${breakdown.crashTestRatings.overall} stars)`,
            advice: 'Consider vehicles with higher safety ratings if safety is a priority.',
        });
    }

    // Medium: High crash count
    if (breakdown.incidents.crashes >= SAFETY_THRESHOLDS.highCrashCount) {
        flags.push({
            type: 'safety_crashes',
            severity: 'medium',
            message: `${breakdown.incidents.crashes} crash incidents reported in NHTSA complaints`,
        });
    }

    // Low: Low overall safety score
    if (safetyResult.score < SAFETY_THRESHOLDS.lowSafetyScore && flags.length === 0) {
        flags.push({
            type: 'safety_overall',
            severity: 'low',
            message: `Below average safety score (${safetyResult.score}/10)`,
            advice: 'Review specific safety concerns for this vehicle model.',
        });
    }

    return flags;
}

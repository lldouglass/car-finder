/**
 * Dynamic Reliability Calculator
 * Calculates reliability scores using multiple data sources:
 * 1. Static reliability database (most accurate when available)
 * 2. NHTSA complaint data (derived score for unknown vehicles)
 * 3. Safety ratings as a proxy for engineering quality
 */

import type { Complaint, SafetyRating } from './nhtsa';
import { getReliabilityData, type VehicleReliability } from './reliability-data';

export interface DynamicReliabilityResult {
    score: number;
    source: 'database' | 'nhtsa_derived' | 'default';
    confidence: 'high' | 'medium' | 'low';
    factors: {
        baseScore: number;
        complaintAdjustment: number;
        safetyAdjustment: number;
        yearAdjustment: number;
    };
}

/**
 * Calculates a weighted complaint severity score.
 * Higher weights for more serious incidents.
 */
function calculateComplaintSeverityScore(complaints: Complaint[]): number {
    if (complaints.length === 0) return 0;

    let severityScore = 0;

    for (const complaint of complaints) {
        // Weight by severity
        if (complaint.Deaths > 0) severityScore += complaint.Deaths * 50;
        if (complaint.Injuries > 0) severityScore += complaint.Injuries * 20;
        if (complaint.Fire) severityScore += 15;
        if (complaint.Crash) severityScore += 10;
        // Base complaint weight
        severityScore += 1;
    }

    return severityScore;
}

/**
 * Calculates reliability using the static database as base, with adjustments.
 */
function calculateWithDatabaseBase(
    staticData: VehicleReliability,
    complaints: Complaint[],
    safetyRating: SafetyRating | null,
    year: number
): DynamicReliabilityResult {
    let score = staticData.baseScore;
    const factors = {
        baseScore: staticData.baseScore,
        complaintAdjustment: 0,
        safetyAdjustment: 0,
        yearAdjustment: 0,
    };

    // Year adjustment for known problematic years
    if (staticData.yearsToAvoid.includes(year)) {
        factors.yearAdjustment = -2.0;
        score += factors.yearAdjustment;
    }

    // Slight positive adjustment for recent years (better technology)
    if (year >= 2018 && !staticData.yearsToAvoid.includes(year)) {
        factors.yearAdjustment = 0.3;
        score += factors.yearAdjustment;
    }

    // Complaint adjustment (minor, since we trust database)
    if (complaints.length > 0) {
        const severityScore = calculateComplaintSeverityScore(complaints);
        // Normalize by expected complaints (rough estimate)
        const normalizedSeverity = severityScore / 100;

        if (normalizedSeverity > 5) {
            factors.complaintAdjustment = -1.0;
        } else if (normalizedSeverity > 2) {
            factors.complaintAdjustment = -0.5;
        } else if (normalizedSeverity < 0.5) {
            factors.complaintAdjustment = 0.3;
        }

        score += factors.complaintAdjustment;
    }

    // Safety rating bonus/penalty
    if (safetyRating) {
        const overallRating = parseInt(safetyRating.OverallRating, 10);
        if (!isNaN(overallRating)) {
            if (overallRating === 5) factors.safetyAdjustment = 0.3;
            else if (overallRating === 4) factors.safetyAdjustment = 0.15;
            else if (overallRating <= 2) factors.safetyAdjustment = -0.3;
        }
        score += factors.safetyAdjustment;
    }

    return {
        score: Math.max(1, Math.min(10, Math.round(score * 10) / 10)),
        source: 'database',
        confidence: 'high',
        factors,
    };
}

/**
 * Derives reliability score from NHTSA data when no database entry exists.
 * Uses complaint patterns and safety ratings as proxies.
 */
function deriveFromNHTSAData(
    make: string,
    model: string,
    year: number,
    complaints: Complaint[],
    safetyRating: SafetyRating | null
): DynamicReliabilityResult {
    // Start at neutral 5.0
    let score = 5.0;
    const factors = {
        baseScore: 5.0,
        complaintAdjustment: 0,
        safetyAdjustment: 0,
        yearAdjustment: 0,
    };

    // Calculate vehicle age
    const currentYear = new Date().getFullYear();
    const vehicleAge = Math.max(1, currentYear - year);

    // Complaint-based adjustment
    // Normalize by vehicle age (older vehicles accumulate more complaints)
    const complaintsPerYear = complaints.length / vehicleAge;

    // Industry average is roughly 50-100 complaints per year per model for popular vehicles
    // We'll use a more conservative threshold since we don't know production volume
    if (complaintsPerYear < 10) {
        factors.complaintAdjustment = 2.0;  // Very few complaints - excellent
    } else if (complaintsPerYear < 30) {
        factors.complaintAdjustment = 1.0;  // Below average complaints - good
    } else if (complaintsPerYear < 60) {
        factors.complaintAdjustment = 0;    // Average complaints - neutral
    } else if (complaintsPerYear < 100) {
        factors.complaintAdjustment = -1.5; // Above average - concerning
    } else {
        factors.complaintAdjustment = -2.5; // High complaint rate - poor
    }

    // Additional severity penalty for safety incidents
    const safetyIncidents = complaints.filter(
        c => c.Crash || c.Fire || c.Deaths > 0 || c.Injuries > 0
    );
    const safetyIncidentRate = safetyIncidents.length / vehicleAge;

    if (safetyIncidentRate > 5) {
        factors.complaintAdjustment -= 1.0;
    } else if (safetyIncidentRate > 2) {
        factors.complaintAdjustment -= 0.5;
    }

    // Check for any deaths - critical penalty
    const hasDeaths = complaints.some(c => c.Deaths > 0);
    if (hasDeaths) {
        factors.complaintAdjustment -= 1.0;
    }

    // Safety rating bonus/penalty
    if (safetyRating) {
        const overallRating = parseInt(safetyRating.OverallRating, 10);
        if (!isNaN(overallRating)) {
            if (overallRating === 5) factors.safetyAdjustment = 0.5;
            else if (overallRating === 4) factors.safetyAdjustment = 0.25;
            else if (overallRating === 3) factors.safetyAdjustment = 0;
            else if (overallRating === 2) factors.safetyAdjustment = -0.5;
            else factors.safetyAdjustment = -1.0;
        }
        score += factors.safetyAdjustment;
    }

    // Year adjustment for newer vehicles
    if (year >= 2020) {
        factors.yearAdjustment = 0.5;
    } else if (year >= 2015) {
        factors.yearAdjustment = 0.25;
    } else if (year < 2010) {
        factors.yearAdjustment = -0.25;
    }

    score += factors.complaintAdjustment + factors.safetyAdjustment + factors.yearAdjustment;

    // Determine confidence based on data availability
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (complaints.length < 5 && !safetyRating) {
        confidence = 'low';
    } else if (complaints.length >= 20 || safetyRating) {
        confidence = 'medium';
    }

    return {
        score: Math.max(1, Math.min(10, Math.round(score * 10) / 10)),
        source: 'nhtsa_derived',
        confidence,
        factors,
    };
}

/**
 * Calculates reliability score using multiple data sources.
 *
 * Priority:
 * 1. Static database (highest accuracy for known vehicles)
 * 2. NHTSA-derived score (for unknown vehicles)
 * 3. Default score (when no data available)
 *
 * @param make - Vehicle make
 * @param model - Vehicle model
 * @param year - Vehicle year
 * @param complaints - NHTSA complaints for this vehicle
 * @param safetyRating - NHTSA safety rating (if available)
 * @returns Dynamic reliability result with score, source, and factors
 */
export function calculateDynamicReliability(
    make: string,
    model: string,
    year: number,
    complaints: Complaint[],
    safetyRating: SafetyRating | null
): DynamicReliabilityResult {
    // Check static database first
    const staticData = getReliabilityData(make, model);

    if (staticData) {
        // Use database score with adjustments from NHTSA data
        return calculateWithDatabaseBase(staticData, complaints, safetyRating, year);
    }

    // No database entry - derive from NHTSA data
    if (complaints.length > 0 || safetyRating) {
        return deriveFromNHTSAData(make, model, year, complaints, safetyRating);
    }

    // No data available - return default
    return {
        score: 5.0,
        source: 'default',
        confidence: 'low',
        factors: {
            baseScore: 5.0,
            complaintAdjustment: 0,
            safetyAdjustment: 0,
            yearAdjustment: 0,
        },
    };
}

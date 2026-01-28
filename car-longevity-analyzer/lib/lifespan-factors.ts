/**
 * Lifespan Adjustment System
 * Calculates adjusted vehicle lifespan based on various factors
 */

// === Type Definitions ===

export type TransmissionType = 'cvt' | 'automatic' | 'manual' | 'dct' | 'unknown';
export type DrivetrainType = 'fwd' | 'rwd' | 'awd' | '4wd' | 'unknown';
export type EngineType = 'naturally_aspirated' | 'turbo' | 'supercharged' | 'hybrid' | 'diesel' | 'electric' | 'unknown';
export type MaintenanceQuality = 'excellent' | 'good' | 'average' | 'poor' | 'unknown';
export type DrivingConditions = 'highway_primary' | 'mixed' | 'city_primary' | 'severe' | 'unknown';
export type ClimateRegion = 'rust_belt' | 'extreme_heat' | 'extreme_cold' | 'coastal_salt' | 'moderate' | 'unknown';
export type AccidentSeverity = 'none' | 'minor' | 'moderate' | 'severe' | 'unknown';
export type OwnershipHistory = 'single_owner' | 'two_owners' | 'multiple_owners' | 'unknown';

export interface LifespanFactors {
    transmission?: TransmissionType;
    drivetrain?: DrivetrainType;
    engine?: EngineType;
    maintenance?: MaintenanceQuality;
    drivingConditions?: DrivingConditions;
    climate?: ClimateRegion;
    accidentHistory?: AccidentSeverity;
    ownerCount?: OwnershipHistory;
}

export interface AppliedFactor {
    category: string;
    value: string;
    multiplier: number;
    impact: 'positive' | 'negative' | 'neutral';
}

// Known issue for lifespan adjustment (simplified from API type)
export interface KnownIssueForLifespan {
    severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
    component?: string;
}

export interface AdjustedLifespanResult {
    baseLifespan: number;
    adjustedLifespan: number;
    totalMultiplier: number;
    appliedFactors: AppliedFactor[];
    confidence: 'high' | 'medium' | 'low';
}

// === Multiplier Constants ===

const TRANSMISSION_MULTIPLIERS: Record<TransmissionType, number> = {
    manual: 1.08,       // +8%: fewer complex parts, driver-controlled
    automatic: 1.0,     // baseline
    dct: 0.95,          // -5%: dual-clutch can have reliability issues
    cvt: 0.85,          // -15%: CVTs have shorter lifespan historically
    unknown: 1.0,
};

const DRIVETRAIN_MULTIPLIERS: Record<DrivetrainType, number> = {
    fwd: 1.0,           // baseline: simpler, fewer parts
    rwd: 1.0,           // baseline: traditional, well-understood
    awd: 0.95,          // -5%: more complexity, transfer case wear
    '4wd': 0.93,        // -7%: heavy-duty but more wear points
    unknown: 1.0,
};

const ENGINE_MULTIPLIERS: Record<EngineType, number> = {
    electric: 1.20,          // +20%: far fewer moving parts
    hybrid: 1.10,            // +10%: regenerative braking, less engine wear
    naturally_aspirated: 1.0, // baseline
    diesel: 1.05,            // +5%: built for longevity
    turbo: 0.95,             // -5%: added complexity, heat stress
    supercharged: 0.90,      // -10%: significant added stress
    unknown: 1.0,
};

const MAINTENANCE_MULTIPLIERS: Record<MaintenanceQuality, number> = {
    excellent: 1.15,    // +15%: dealer/meticulous records
    good: 1.05,         // +5%: regular maintenance
    average: 1.0,       // baseline
    poor: 0.80,         // -20%: neglected maintenance
    unknown: 1.0,
};

const DRIVING_CONDITIONS_MULTIPLIERS: Record<DrivingConditions, number> = {
    highway_primary: 1.10,   // +10%: steady speeds, less wear
    mixed: 1.0,              // baseline
    city_primary: 0.92,      // -8%: stop-and-go wear
    severe: 0.80,            // -20%: towing, off-road, extreme use
    unknown: 1.0,
};

const CLIMATE_MULTIPLIERS: Record<ClimateRegion, number> = {
    moderate: 1.05,      // +5%: ideal conditions
    extreme_heat: 0.92,  // -8%: heat stress on components
    extreme_cold: 0.92,  // -8%: cold starts, battery wear
    coastal_salt: 0.90,  // -10%: salt air corrosion
    rust_belt: 0.85,     // -15%: road salt corrosion
    unknown: 1.0,
};

const ACCIDENT_MULTIPLIERS: Record<AccidentSeverity, number> = {
    none: 1.05,          // +5%: clean history bonus
    minor: 0.95,         // -5%: fender benders, cosmetic
    moderate: 0.85,      // -15%: structural concern
    severe: 0.70,        // -30%: major structural damage
    unknown: 1.0,
};

const OWNERSHIP_MULTIPLIERS: Record<OwnershipHistory, number> = {
    single_owner: 1.08,      // +8%: consistent care
    two_owners: 1.0,         // baseline
    multiple_owners: 0.95,   // -5%: varied maintenance quality
    unknown: 1.0,
};

// === Known Issue Severity Multipliers ===
// Known issues like Theta 2 engine failure reduce expected lifespan
export const KNOWN_ISSUE_MULTIPLIERS: Record<string, number> = {
    critical: 0.75,  // -25% lifespan (e.g., engine failure risk)
    major: 0.90,     // -10% lifespan
    moderate: 0.95,  // -5% lifespan
    minor: 1.0,      // No impact on lifespan
};

// === Clamping Limits ===
const MIN_MULTIPLIER = 0.5;
const MAX_MULTIPLIER = 1.5;

// === Helper Functions ===

function getFactorLabel(category: string): string {
    const labels: Record<string, string> = {
        transmission: 'Transmission Type',
        drivetrain: 'Drivetrain',
        engine: 'Engine Type',
        maintenance: 'Maintenance Quality',
        drivingConditions: 'Driving Conditions',
        climate: 'Climate Region',
        accidentHistory: 'Accident History',
        ownerCount: 'Ownership History',
    };
    return labels[category] || category;
}

function formatFactorValue(category: string, value: string): string {
    const formatters: Record<string, Record<string, string>> = {
        transmission: {
            cvt: 'CVT',
            automatic: 'Automatic',
            manual: 'Manual',
            dct: 'Dual-Clutch (DCT)',
            unknown: 'Unknown',
        },
        drivetrain: {
            fwd: 'Front-Wheel Drive',
            rwd: 'Rear-Wheel Drive',
            awd: 'All-Wheel Drive',
            '4wd': '4-Wheel Drive',
            unknown: 'Unknown',
        },
        engine: {
            naturally_aspirated: 'Naturally Aspirated',
            turbo: 'Turbocharged',
            supercharged: 'Supercharged',
            hybrid: 'Hybrid',
            diesel: 'Diesel',
            electric: 'Electric',
            unknown: 'Unknown',
        },
        maintenance: {
            excellent: 'Excellent',
            good: 'Good',
            average: 'Average',
            poor: 'Poor',
            unknown: 'Unknown',
        },
        drivingConditions: {
            highway_primary: 'Highway Primary',
            mixed: 'Mixed',
            city_primary: 'City Primary',
            severe: 'Severe (Towing/Off-road)',
            unknown: 'Unknown',
        },
        climate: {
            rust_belt: 'Rust Belt',
            extreme_heat: 'Extreme Heat',
            extreme_cold: 'Extreme Cold',
            coastal_salt: 'Coastal (Salt Air)',
            moderate: 'Moderate',
            unknown: 'Unknown',
        },
        accidentHistory: {
            none: 'No Accidents',
            minor: 'Minor Accidents',
            moderate: 'Moderate Accidents',
            severe: 'Severe Accidents',
            unknown: 'Unknown',
        },
        ownerCount: {
            single_owner: 'Single Owner',
            two_owners: 'Two Owners',
            multiple_owners: 'Multiple Owners (3+)',
            unknown: 'Unknown',
        },
    };
    return formatters[category]?.[value] || value;
}

function getImpact(multiplier: number): 'positive' | 'negative' | 'neutral' {
    if (multiplier > 1.0) return 'positive';
    if (multiplier < 1.0) return 'negative';
    return 'neutral';
}

// === Main Function ===

/**
 * Calculates adjusted vehicle lifespan based on various factors.
 * Unknown/missing factors default to 1.0 multiplier (no change).
 * Total multiplier is clamped to 0.5-1.5 range.
 *
 * @param baseLifespan - Base expected lifespan in miles
 * @param factors - Vehicle configuration factors
 * @param knownIssues - Known issues from NHTSA complaints (optional)
 */
export function calculateAdjustedLifespan(
    baseLifespan: number,
    factors: LifespanFactors,
    knownIssues: KnownIssueForLifespan[] = []
): AdjustedLifespanResult {
    const appliedFactors: AppliedFactor[] = [];
    let totalMultiplier = 1.0;
    let knownFactorCount = 0;

    // Process each factor category
    const factorEntries: Array<{
        category: string;
        value: string | undefined;
        multipliers: Record<string, number>;
    }> = [
        { category: 'transmission', value: factors.transmission, multipliers: TRANSMISSION_MULTIPLIERS },
        { category: 'drivetrain', value: factors.drivetrain, multipliers: DRIVETRAIN_MULTIPLIERS },
        { category: 'engine', value: factors.engine, multipliers: ENGINE_MULTIPLIERS },
        { category: 'maintenance', value: factors.maintenance, multipliers: MAINTENANCE_MULTIPLIERS },
        { category: 'drivingConditions', value: factors.drivingConditions, multipliers: DRIVING_CONDITIONS_MULTIPLIERS },
        { category: 'climate', value: factors.climate, multipliers: CLIMATE_MULTIPLIERS },
        { category: 'accidentHistory', value: factors.accidentHistory, multipliers: ACCIDENT_MULTIPLIERS },
        { category: 'ownerCount', value: factors.ownerCount, multipliers: OWNERSHIP_MULTIPLIERS },
    ];

    for (const { category, value, multipliers } of factorEntries) {
        if (value && value !== 'unknown') {
            const multiplier = multipliers[value] ?? 1.0;
            totalMultiplier *= multiplier;
            knownFactorCount++;

            appliedFactors.push({
                category: getFactorLabel(category),
                value: formatFactorValue(category, value),
                multiplier,
                impact: getImpact(multiplier),
            });
        }
    }

    // Apply known issue multipliers (use worst severity if multiple issues)
    if (knownIssues && knownIssues.length > 0) {
        // Find the worst severity issue
        const severityRank: Record<string, number> = {
            'CRITICAL': 0,
            'MAJOR': 1,
            'MODERATE': 2,
            'MINOR': 3,
        };

        const worstIssue = knownIssues.reduce((worst, current) => {
            const currentRank = severityRank[current.severity] ?? 3;
            const worstRank = severityRank[worst.severity] ?? 3;
            return currentRank < worstRank ? current : worst;
        });

        const severityKey = worstIssue.severity.toLowerCase();
        const issueMultiplier = KNOWN_ISSUE_MULTIPLIERS[severityKey] ?? 1.0;

        if (issueMultiplier < 1.0) {
            totalMultiplier *= issueMultiplier;
            knownFactorCount++;

            // Create descriptive label for the issue
            const issueLabel = worstIssue.component
                ? `${worstIssue.severity} ${worstIssue.component} Issue`
                : `${worstIssue.severity} Known Issue`;

            appliedFactors.push({
                category: 'Known Issues',
                value: issueLabel,
                multiplier: issueMultiplier,
                impact: 'negative',
            });
        }
    }

    // Clamp total multiplier to reasonable bounds
    const clampedMultiplier = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, totalMultiplier));
    const adjustedLifespan = Math.round(baseLifespan * clampedMultiplier);

    // Determine confidence based on known factors
    let confidence: 'high' | 'medium' | 'low';
    if (knownFactorCount >= 5) {
        confidence = 'high';
    } else if (knownFactorCount >= 2) {
        confidence = 'medium';
    } else {
        confidence = 'low';
    }

    return {
        baseLifespan,
        adjustedLifespan,
        totalMultiplier: Math.round(clampedMultiplier * 1000) / 1000,
        appliedFactors,
        confidence,
    };
}

/**
 * Converts owner count number to OwnershipHistory type
 */
export function ownerCountToHistory(count: number | null): OwnershipHistory {
    if (count === null || count === undefined) return 'unknown';
    if (count === 1) return 'single_owner';
    if (count === 2) return 'two_owners';
    if (count >= 3) return 'multiple_owners';
    return 'unknown';
}

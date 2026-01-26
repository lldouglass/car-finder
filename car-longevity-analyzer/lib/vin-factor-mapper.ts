/**
 * VIN Factor Mapper
 * Maps NHTSA VIN decode data to lifespan adjustment factors
 */

import type { VehicleDetails } from './nhtsa';
import type {
    TransmissionType,
    DrivetrainType,
    EngineType,
    LifespanFactors,
} from './lifespan-factors';

// === Known CVT Makes/Models ===
// These make/model combinations commonly use CVT transmissions
const CVT_VEHICLES: Record<string, string[]> = {
    nissan: ['altima', 'rogue', 'sentra', 'maxima', 'murano', 'pathfinder', 'juke', 'versa', 'kicks'],
    subaru: ['outback', 'forester', 'crosstrek', 'impreza', 'legacy', 'ascent'],
    honda: ['hr-v', 'insight'],
    toyota: ['corolla', 'c-hr', 'corolla cross'], // Some models after 2019
    mitsubishi: ['outlander', 'eclipse cross', 'mirage'],
    jeep: ['compass', 'renegade', 'patriot'], // Some variants
};

// Year ranges for CVT adoption (model year when CVT became common)
const CVT_ADOPTION_YEARS: Record<string, number> = {
    nissan: 2007,
    subaru: 2010,
    honda: 2016,
    toyota: 2019,
    mitsubishi: 2013,
    jeep: 2014,
};

// === Drive Type Mapping ===
const DRIVE_TYPE_MAP: Record<string, DrivetrainType> = {
    'fwd': 'fwd',
    'front wheel drive': 'fwd',
    'front-wheel drive': 'fwd',
    'rwd': 'rwd',
    'rear wheel drive': 'rwd',
    'rear-wheel drive': 'rwd',
    'awd': 'awd',
    'all wheel drive': 'awd',
    'all-wheel drive': 'awd',
    '4wd': '4wd',
    '4x4': '4wd',
    'four wheel drive': '4wd',
    'four-wheel drive': '4wd',
    '4-wheel drive': '4wd',
};

// === Fuel Type / Engine Mapping ===
const FUEL_TYPE_MAP: Record<string, EngineType> = {
    'gasoline': 'naturally_aspirated',
    'gas': 'naturally_aspirated',
    'diesel': 'diesel',
    'electric': 'electric',
    'battery electric vehicle (bev)': 'electric',
    'hybrid': 'hybrid',
    'plug-in hybrid (phev)': 'hybrid',
    'flexible fuel vehicle (ffv)': 'naturally_aspirated',
    'hydrogen fuel cell': 'electric',
    'compressed natural gas (cng)': 'naturally_aspirated',
};

/**
 * Maps NHTSA drive type string to DrivetrainType
 */
export function mapDriveType(driveType: string | undefined): DrivetrainType {
    if (!driveType) return 'unknown';

    const normalized = driveType.toLowerCase().trim();

    // Direct lookup
    if (DRIVE_TYPE_MAP[normalized]) {
        return DRIVE_TYPE_MAP[normalized];
    }

    // Partial matching
    for (const [pattern, type] of Object.entries(DRIVE_TYPE_MAP)) {
        if (normalized.includes(pattern)) {
            return type;
        }
    }

    return 'unknown';
}

/**
 * Maps NHTSA fuel type and engine info to EngineType
 */
export function mapEngineType(
    fuelType: string | undefined,
    device: string | undefined
): EngineType {
    // Check device string for turbo/supercharger indicators
    if (device) {
        const deviceLower = device.toLowerCase();
        if (deviceLower.includes('turbo') || deviceLower.includes('twinpower')) {
            return 'turbo';
        }
        if (deviceLower.includes('supercharge')) {
            return 'supercharged';
        }
    }

    if (!fuelType) return 'unknown';

    const normalizedFuel = fuelType.toLowerCase().trim();

    // Direct lookup
    if (FUEL_TYPE_MAP[normalizedFuel]) {
        return FUEL_TYPE_MAP[normalizedFuel];
    }

    // Partial matching
    for (const [pattern, type] of Object.entries(FUEL_TYPE_MAP)) {
        if (normalizedFuel.includes(pattern)) {
            return type;
        }
    }

    // Check for hybrid in fuel type string
    if (normalizedFuel.includes('hybrid')) {
        return 'hybrid';
    }

    // Check for electric
    if (normalizedFuel.includes('electric') || normalizedFuel.includes('bev')) {
        return 'electric';
    }

    return 'unknown';
}

/**
 * Determines transmission type based on make/model/year
 * Uses known CVT vehicle data to infer CVT usage
 */
export function inferTransmissionType(
    make: string,
    model: string,
    year: number,
    transmissionStyle?: string
): TransmissionType {
    // If we have explicit transmission info from NHTSA
    if (transmissionStyle) {
        const transLower = transmissionStyle.toLowerCase();
        if (transLower.includes('cvt') || transLower.includes('continuously variable')) {
            return 'cvt';
        }
        if (transLower.includes('manual')) {
            return 'manual';
        }
        if (transLower.includes('dct') || transLower.includes('dual clutch') || transLower.includes('dual-clutch')) {
            return 'dct';
        }
        if (transLower.includes('automatic')) {
            return 'automatic';
        }
    }

    // Infer from known CVT vehicles
    const makeLower = make.toLowerCase().trim();
    const modelLower = model.toLowerCase().trim();

    const cvtModels = CVT_VEHICLES[makeLower];
    if (cvtModels) {
        const adoptionYear = CVT_ADOPTION_YEARS[makeLower] || 2010;
        if (year >= adoptionYear) {
            // Check if model matches any CVT models
            for (const cvtModel of cvtModels) {
                if (modelLower.includes(cvtModel) || cvtModel.includes(modelLower)) {
                    return 'cvt';
                }
            }
        }
    }

    // Default to automatic for modern vehicles, unknown for older
    if (year >= 1990) {
        return 'automatic';
    }

    return 'unknown';
}

/**
 * Maps VIN-decoded vehicle details to lifespan factors
 */
export function mapVinToLifespanFactors(
    vehicle: VehicleDetails,
    transmissionStyle?: string
): Partial<LifespanFactors> {
    const factors: Partial<LifespanFactors> = {};

    // Map drivetrain
    factors.drivetrain = mapDriveType(vehicle.driveType);

    // Map engine type
    factors.engine = mapEngineType(vehicle.fuelType, vehicle.device);

    // Infer transmission type
    factors.transmission = inferTransmissionType(
        vehicle.make,
        vehicle.model,
        vehicle.year,
        transmissionStyle
    );

    return factors;
}

/**
 * Merges VIN-derived factors with AI-extracted factors.
 * AI factors take precedence for maintenance, accidents, owners, driving conditions.
 * VIN factors are authoritative for drivetrain, engine, transmission.
 */
export function mergeLifespanFactors(
    vinFactors: Partial<LifespanFactors>,
    aiFactors: Partial<LifespanFactors>,
    climateRegion?: LifespanFactors['climate']
): LifespanFactors {
    return {
        // VIN-derived (authoritative for mechanical specs)
        transmission: vinFactors.transmission || aiFactors.transmission || 'unknown',
        drivetrain: vinFactors.drivetrain || aiFactors.drivetrain || 'unknown',
        engine: vinFactors.engine || aiFactors.engine || 'unknown',

        // AI-extracted (authoritative for listing-derived info)
        maintenance: aiFactors.maintenance || 'unknown',
        drivingConditions: aiFactors.drivingConditions || 'unknown',
        accidentHistory: aiFactors.accidentHistory || 'unknown',
        ownerCount: aiFactors.ownerCount || 'unknown',

        // Location-based
        climate: climateRegion || 'unknown',
    };
}

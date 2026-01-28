/**
 * Maintenance Cost Projection System
 * Predicts upcoming maintenance based on make/model/year and current mileage
 */

// === Type Definitions ===

export type MaintenanceUrgency = 'past_due' | 'due_now' | 'upcoming' | 'future';
export type FailureSeverity = 'critical' | 'major' | 'moderate' | 'minor';
export type MaintenanceCategory =
    | 'engine'
    | 'transmission'
    | 'suspension'
    | 'brakes'
    | 'electrical'
    | 'cooling'
    | 'exhaust'
    | 'steering'
    | 'fuel_system'
    | 'timing'
    | 'drivetrain'
    | 'other';

export interface MaintenanceItem {
    id: string;
    name: string;
    component: string;
    category: MaintenanceCategory;
    typicalFailureMileageMin: number;
    typicalFailureMileageMax: number;
    estimatedCostLow: number;
    estimatedCostHigh: number;
    severity: FailureSeverity;
    description: string;
    warningSymptoms?: string[];
}

export interface VehicleMaintenanceProfile {
    make: string;
    model: string;
    yearStart?: number;
    yearEnd?: number;
    maintenanceItems: MaintenanceItem[];
}

export interface MaintenanceProjection {
    item: MaintenanceItem;
    urgency: MaintenanceUrgency;
    milesUntilDue: number;
    progressThroughWindow: number;
    adjustedCostLow: number;
    adjustedCostHigh: number;
}

export interface MaintenanceCostSummary {
    projections: MaintenanceProjection[];
    pastDueCount: number;
    dueNowCount: number;
    upcomingCount: number;
    immediateRepairCostLow: number;
    immediateRepairCostHigh: number;
    upcomingCostLow: number;
    upcomingCostHigh: number;
    maintenanceHealthScore: number;
}

// === Universal Maintenance Items ===

export const UNIVERSAL_MAINTENANCE_ITEMS: MaintenanceItem[] = [
    {
        id: 'timing-belt',
        name: 'Timing Belt Replacement',
        component: 'Timing Belt',
        category: 'timing',
        typicalFailureMileageMin: 60000,
        typicalFailureMileageMax: 105000,
        estimatedCostLow: 500,
        estimatedCostHigh: 1200,
        severity: 'critical',
        description: 'Timing belt synchronizes engine components. Failure can cause catastrophic engine damage.',
        warningSymptoms: ['Ticking noise from engine', 'Engine misfires', 'Oil leaking near motor', 'Engine won\'t turn over'],
    },
    {
        id: 'water-pump',
        name: 'Water Pump Replacement',
        component: 'Water Pump',
        category: 'cooling',
        typicalFailureMileageMin: 60000,
        typicalFailureMileageMax: 100000,
        estimatedCostLow: 300,
        estimatedCostHigh: 800,
        severity: 'major',
        description: 'Water pump circulates coolant through the engine. Often replaced with timing belt.',
        warningSymptoms: ['Coolant leak under car', 'Engine overheating', 'Whining noise from front of engine', 'Steam from radiator'],
    },
    {
        id: 'brake-pads-front',
        name: 'Front Brake Pads',
        component: 'Front Brake Pads',
        category: 'brakes',
        typicalFailureMileageMin: 30000,
        typicalFailureMileageMax: 70000,
        estimatedCostLow: 150,
        estimatedCostHigh: 350,
        severity: 'major',
        description: 'Front brake pads wear faster due to weight transfer during braking.',
        warningSymptoms: ['Squealing when braking', 'Grinding noise', 'Longer stopping distance', 'Brake pedal vibration'],
    },
    {
        id: 'brake-pads-rear',
        name: 'Rear Brake Pads',
        component: 'Rear Brake Pads',
        category: 'brakes',
        typicalFailureMileageMin: 40000,
        typicalFailureMileageMax: 80000,
        estimatedCostLow: 120,
        estimatedCostHigh: 300,
        severity: 'major',
        description: 'Rear brake pads typically last longer than front pads.',
        warningSymptoms: ['Squealing from rear when braking', 'Grinding noise', 'Parking brake issues'],
    },
    {
        id: 'brake-rotors',
        name: 'Brake Rotors',
        component: 'Brake Rotors',
        category: 'brakes',
        typicalFailureMileageMin: 50000,
        typicalFailureMileageMax: 80000,
        estimatedCostLow: 300,
        estimatedCostHigh: 600,
        severity: 'major',
        description: 'Rotors wear over time and may need resurfacing or replacement.',
        warningSymptoms: ['Vibration when braking', 'Grooves visible on rotor', 'Pulsating brake pedal'],
    },
    {
        id: 'transmission-service',
        name: 'Transmission Fluid Service',
        component: 'Transmission',
        category: 'transmission',
        typicalFailureMileageMin: 60000,
        typicalFailureMileageMax: 100000,
        estimatedCostLow: 150,
        estimatedCostHigh: 400,
        severity: 'moderate',
        description: 'Transmission fluid degrades over time and should be replaced to prevent wear.',
        warningSymptoms: ['Rough shifting', 'Slipping gears', 'Delayed engagement', 'Burning smell'],
    },
    {
        id: 'spark-plugs',
        name: 'Spark Plug Replacement',
        component: 'Spark Plugs',
        category: 'engine',
        typicalFailureMileageMin: 80000,
        typicalFailureMileageMax: 120000,
        estimatedCostLow: 100,
        estimatedCostHigh: 300,
        severity: 'moderate',
        description: 'Spark plugs ignite the fuel-air mixture. Worn plugs cause poor performance.',
        warningSymptoms: ['Rough idle', 'Poor fuel economy', 'Engine misfires', 'Difficulty starting'],
    },
    {
        id: 'suspension-struts',
        name: 'Struts/Shocks Replacement',
        component: 'Struts/Shocks',
        category: 'suspension',
        typicalFailureMileageMin: 75000,
        typicalFailureMileageMax: 100000,
        estimatedCostLow: 400,
        estimatedCostHigh: 900,
        severity: 'moderate',
        description: 'Struts and shocks wear over time, affecting ride quality and handling.',
        warningSymptoms: ['Bouncy ride', 'Nose diving when braking', 'Uneven tire wear', 'Leaking fluid'],
    },
    {
        id: 'alternator',
        name: 'Alternator Replacement',
        component: 'Alternator',
        category: 'electrical',
        typicalFailureMileageMin: 80000,
        typicalFailureMileageMax: 150000,
        estimatedCostLow: 400,
        estimatedCostHigh: 800,
        severity: 'major',
        description: 'Alternator charges the battery and powers electrical systems while driving.',
        warningSymptoms: ['Battery warning light', 'Dim headlights', 'Electrical issues', 'Dead battery'],
    },
    {
        id: 'starter-motor',
        name: 'Starter Motor Replacement',
        component: 'Starter Motor',
        category: 'electrical',
        typicalFailureMileageMin: 100000,
        typicalFailureMileageMax: 150000,
        estimatedCostLow: 300,
        estimatedCostHigh: 600,
        severity: 'major',
        description: 'Starter motor cranks the engine to start. Failure prevents starting.',
        warningSymptoms: ['Clicking when turning key', 'Grinding noise on start', 'Intermittent starting issues'],
    },
    {
        id: 'ac-compressor',
        name: 'A/C Compressor',
        component: 'A/C Compressor',
        category: 'cooling',
        typicalFailureMileageMin: 100000,
        typicalFailureMileageMax: 150000,
        estimatedCostLow: 500,
        estimatedCostHigh: 1200,
        severity: 'moderate',
        description: 'A/C compressor pressurizes refrigerant for the air conditioning system.',
        warningSymptoms: ['Weak A/C', 'No cold air', 'Loud noise when A/C on', 'Clutch not engaging'],
    },
    {
        id: 'serpentine-belt',
        name: 'Serpentine Belt',
        component: 'Serpentine Belt',
        category: 'engine',
        typicalFailureMileageMin: 60000,
        typicalFailureMileageMax: 100000,
        estimatedCostLow: 100,
        estimatedCostHigh: 250,
        severity: 'major',
        description: 'Serpentine belt drives multiple accessories. Failure disables power steering, A/C, and alternator.',
        warningSymptoms: ['Squealing noise', 'Visible cracks', 'Power steering loss', 'Battery not charging'],
    },
];

// === Vehicle-Specific Maintenance Profiles ===

export const VEHICLE_MAINTENANCE_PROFILES: VehicleMaintenanceProfile[] = [
    // Toyota Camry 2007-2011 (2AZ-FE engine oil consumption issue)
    {
        make: 'Toyota',
        model: 'Camry',
        yearStart: 2007,
        yearEnd: 2011,
        maintenanceItems: [
            {
                id: 'toyota-camry-oil-consumption',
                name: 'Piston Ring Replacement',
                component: 'Piston Rings',
                category: 'engine',
                typicalFailureMileageMin: 80000,
                typicalFailureMileageMax: 150000,
                estimatedCostLow: 2500,
                estimatedCostHigh: 5000,
                severity: 'major',
                description: 'Known oil consumption issue in 2AZ-FE engines. May require piston ring replacement.',
                warningSymptoms: ['Excessive oil consumption (1qt per 1000 miles)', 'Blue smoke from exhaust', 'Low oil light'],
            },
        ],
    },
    // Honda Accord 2008-2012 (VTEC solenoid gasket)
    {
        make: 'Honda',
        model: 'Accord',
        yearStart: 2008,
        yearEnd: 2012,
        maintenanceItems: [
            {
                id: 'honda-accord-vtec-solenoid',
                name: 'VTEC Solenoid Gasket',
                component: 'VTEC Solenoid',
                category: 'engine',
                typicalFailureMileageMin: 100000,
                typicalFailureMileageMax: 150000,
                estimatedCostLow: 150,
                estimatedCostHigh: 400,
                severity: 'moderate',
                description: 'VTEC solenoid gasket tends to leak oil on high-mileage vehicles.',
                warningSymptoms: ['Oil leak near top of engine', 'Check engine light', 'VTEC not engaging'],
            },
        ],
    },
    // Subaru (head gasket issues on older models)
    {
        make: 'Subaru',
        model: 'Outback',
        yearStart: 2000,
        yearEnd: 2009,
        maintenanceItems: [
            {
                id: 'subaru-head-gasket',
                name: 'Head Gasket Replacement',
                component: 'Head Gaskets',
                category: 'engine',
                typicalFailureMileageMin: 100000,
                typicalFailureMileageMax: 150000,
                estimatedCostLow: 1500,
                estimatedCostHigh: 3000,
                severity: 'critical',
                description: 'Known head gasket failure issue on EJ25 engines. External leak or internal failure.',
                warningSymptoms: ['Coolant leak', 'Overheating', 'White smoke from exhaust', 'Milky oil'],
            },
        ],
    },
    {
        make: 'Subaru',
        model: 'Forester',
        yearStart: 2000,
        yearEnd: 2010,
        maintenanceItems: [
            {
                id: 'subaru-forester-head-gasket',
                name: 'Head Gasket Replacement',
                component: 'Head Gaskets',
                category: 'engine',
                typicalFailureMileageMin: 100000,
                typicalFailureMileageMax: 150000,
                estimatedCostLow: 1500,
                estimatedCostHigh: 3000,
                severity: 'critical',
                description: 'Known head gasket failure issue on EJ25 engines.',
                warningSymptoms: ['Coolant leak', 'Overheating', 'White smoke from exhaust', 'Milky oil'],
            },
        ],
    },
    // Nissan CVT transmission issues
    {
        make: 'Nissan',
        model: 'Altima',
        yearStart: 2013,
        yearEnd: 2018,
        maintenanceItems: [
            {
                id: 'nissan-cvt-failure',
                name: 'CVT Transmission Replacement',
                component: 'CVT Transmission',
                category: 'transmission',
                typicalFailureMileageMin: 80000,
                typicalFailureMileageMax: 120000,
                estimatedCostLow: 3000,
                estimatedCostHigh: 5000,
                severity: 'critical',
                description: 'Known CVT reliability issues. May require full transmission replacement.',
                warningSymptoms: ['Shuddering', 'Hesitation', 'Whining noise', 'Loss of power'],
            },
        ],
    },
    {
        make: 'Nissan',
        model: 'Rogue',
        yearStart: 2013,
        yearEnd: 2018,
        maintenanceItems: [
            {
                id: 'nissan-rogue-cvt-failure',
                name: 'CVT Transmission Replacement',
                component: 'CVT Transmission',
                category: 'transmission',
                typicalFailureMileageMin: 80000,
                typicalFailureMileageMax: 120000,
                estimatedCostLow: 3000,
                estimatedCostHigh: 5000,
                severity: 'critical',
                description: 'Known CVT reliability issues in Jatco transmissions.',
                warningSymptoms: ['Shuddering', 'Hesitation', 'Whining noise', 'Loss of power'],
            },
        ],
    },
    // Ford F-150 (cam phaser issues on 5.4L)
    {
        make: 'Ford',
        model: 'F-150',
        yearStart: 2004,
        yearEnd: 2010,
        maintenanceItems: [
            {
                id: 'ford-f150-cam-phaser',
                name: 'Cam Phaser Replacement',
                component: 'Cam Phasers',
                category: 'engine',
                typicalFailureMileageMin: 100000,
                typicalFailureMileageMax: 150000,
                estimatedCostLow: 1500,
                estimatedCostHigh: 3000,
                severity: 'major',
                description: 'Known cam phaser failure on 5.4L 3-valve engines causing timing issues.',
                warningSymptoms: ['Knocking noise at startup', 'Rough idle', 'Check engine light', 'Reduced power'],
            },
        ],
    },
    // BMW (common issues)
    {
        make: 'BMW',
        model: '3 Series',
        yearStart: 2006,
        yearEnd: 2013,
        maintenanceItems: [
            {
                id: 'bmw-water-pump-electric',
                name: 'Electric Water Pump',
                component: 'Electric Water Pump',
                category: 'cooling',
                typicalFailureMileageMin: 60000,
                typicalFailureMileageMax: 100000,
                estimatedCostLow: 800,
                estimatedCostHigh: 1500,
                severity: 'major',
                description: 'Electric water pump known to fail prematurely on N52/N54 engines.',
                warningSymptoms: ['Overheating', 'Coolant warning', 'Reduced engine power mode'],
            },
            {
                id: 'bmw-vanos-solenoids',
                name: 'VANOS Solenoids',
                component: 'VANOS System',
                category: 'engine',
                typicalFailureMileageMin: 70000,
                typicalFailureMileageMax: 120000,
                estimatedCostLow: 400,
                estimatedCostHigh: 800,
                severity: 'moderate',
                description: 'Variable valve timing solenoids can fail causing rough running.',
                warningSymptoms: ['Rough idle', 'Reduced power', 'Check engine light', 'Poor fuel economy'],
            },
        ],
    },
];

// === Calculation Functions ===

/**
 * Get maintenance profile for a specific vehicle
 */
export function getMaintenanceProfile(
    make: string,
    model: string,
    year: number
): MaintenanceItem[] {
    const normMake = make.toLowerCase().trim();
    const normModel = model.toLowerCase().trim();

    // Find vehicle-specific items
    const vehicleProfile = VEHICLE_MAINTENANCE_PROFILES.find(v =>
        v.make.toLowerCase() === normMake &&
        v.model.toLowerCase() === normModel &&
        (!v.yearStart || year >= v.yearStart) &&
        (!v.yearEnd || year <= v.yearEnd)
    );

    const vehicleSpecificItems = vehicleProfile?.maintenanceItems || [];

    // Return vehicle-specific items first, then universal items
    return [...vehicleSpecificItems, ...UNIVERSAL_MAINTENANCE_ITEMS];
}

/**
 * Calculate urgency for a single maintenance item
 */
export function calculateMaintenanceUrgency(
    currentMileage: number,
    item: MaintenanceItem
): { urgency: MaintenanceUrgency; milesUntilDue: number; progressThroughWindow: number } {
    const midpoint = (item.typicalFailureMileageMin + item.typicalFailureMileageMax) / 2;
    const windowSize = item.typicalFailureMileageMax - item.typicalFailureMileageMin;

    // Calculate miles until the midpoint of the failure window
    const milesUntilDue = Math.round(midpoint - currentMileage);

    // Calculate progress through the failure window (0-100%)
    let progressThroughWindow = 0;
    if (currentMileage >= item.typicalFailureMileageMin) {
        progressThroughWindow =
            ((currentMileage - item.typicalFailureMileageMin) / windowSize) * 100;
    }

    // Determine urgency
    let urgency: MaintenanceUrgency;
    if (currentMileage > item.typicalFailureMileageMax) {
        urgency = 'past_due';
    } else if (currentMileage >= item.typicalFailureMileageMin) {
        urgency = 'due_now';
    } else if (currentMileage >= item.typicalFailureMileageMin - 10000) {
        urgency = 'upcoming';
    } else {
        urgency = 'future';
    }

    return {
        urgency,
        milesUntilDue,
        progressThroughWindow: Math.min(100, Math.max(0, progressThroughWindow)),
    };
}

/**
 * Calculate all maintenance projections for a vehicle
 */
export function calculateMaintenanceProjections(
    make: string,
    model: string,
    year: number,
    currentMileage: number
): MaintenanceCostSummary {
    const items = getMaintenanceProfile(make, model, year);

    const projections: MaintenanceProjection[] = items.map(item => {
        const { urgency, milesUntilDue, progressThroughWindow } =
            calculateMaintenanceUrgency(currentMileage, item);

        // Adjust costs for vehicle age (older vehicles may have lower part costs)
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - year;
        const costAdjustment = vehicleAge > 10 ? 0.9 : 1.0;

        return {
            item,
            urgency,
            milesUntilDue,
            progressThroughWindow,
            adjustedCostLow: Math.round(item.estimatedCostLow * costAdjustment),
            adjustedCostHigh: Math.round(item.estimatedCostHigh * costAdjustment),
        };
    });

    // Sort by urgency priority
    const urgencyOrder: Record<MaintenanceUrgency, number> = {
        past_due: 0,
        due_now: 1,
        upcoming: 2,
        future: 3,
    };
    projections.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    // Filter and count by urgency
    const pastDue = projections.filter(p => p.urgency === 'past_due');
    const dueNow = projections.filter(p => p.urgency === 'due_now');
    const upcoming = projections.filter(p => p.urgency === 'upcoming');

    // Calculate cost summaries
    const immediateItems = [...pastDue, ...dueNow];
    const immediateRepairCostLow = immediateItems.reduce((sum, p) => sum + p.adjustedCostLow, 0);
    const immediateRepairCostHigh = immediateItems.reduce((sum, p) => sum + p.adjustedCostHigh, 0);

    const upcomingCostLow = upcoming.reduce((sum, p) => sum + p.adjustedCostLow, 0);
    const upcomingCostHigh = upcoming.reduce((sum, p) => sum + p.adjustedCostHigh, 0);

    // Calculate maintenance health score (10 = excellent, 1 = poor)
    let healthScore = 10;
    healthScore -= pastDue.filter(p => p.item.severity === 'critical').length * 3;
    healthScore -= pastDue.filter(p => p.item.severity !== 'critical').length * 1.5;
    healthScore -= dueNow.filter(p => p.item.severity === 'critical').length * 1.5;
    healthScore -= dueNow.filter(p => p.item.severity !== 'critical').length * 0.5;
    healthScore = Math.max(1, Math.min(10, healthScore));

    return {
        projections: projections.filter(p => p.urgency !== 'future'),
        pastDueCount: pastDue.length,
        dueNowCount: dueNow.length,
        upcomingCount: upcoming.length,
        immediateRepairCostLow,
        immediateRepairCostHigh,
        upcomingCostLow,
        upcomingCostHigh,
        maintenanceHealthScore: Math.round(healthScore * 10) / 10,
    };
}

/**
 * Pre-Purchase Inspection Checklist Generator
 * Creates vehicle-specific inspection checklists based on known issues and red flags
 */

import type { KnownIssue } from './reliability-data';
import type { RedFlag } from './red-flags';

export type InspectionCategory =
    | 'engine'
    | 'transmission'
    | 'brakes'
    | 'suspension'
    | 'electrical'
    | 'body'
    | 'interior'
    | 'fluid'
    | 'exhaust'
    | 'cooling'
    | 'test_drive';

export interface InspectionItem {
    category: InspectionCategory;
    item: string;
    priority: 'critical' | 'important' | 'recommended';
    reason?: string;
    whatToLookFor: string;
    redFlagSigns: string[];
}

export interface InspectionChecklist {
    vehicleSpecificItems: InspectionItem[];
    standardItems: InspectionItem[];
    testDriveChecklist: string[];
    documentsToRequest: string[];
    toolsNeeded: string[];
    estimatedInspectionTime: string;
}

// Standard inspection items for all vehicles
const STANDARD_INSPECTION_ITEMS: InspectionItem[] = [
    // Engine
    {
        category: 'engine',
        item: 'Check oil level and condition',
        priority: 'critical',
        whatToLookFor: 'Oil should be amber/brown, not black or milky. Level should be between min and max.',
        redFlagSigns: ['Milky oil (coolant leak)', 'Metal shavings on dipstick', 'Severely low oil level']
    },
    {
        category: 'engine',
        item: 'Look for oil leaks',
        priority: 'important',
        whatToLookFor: 'Check under the vehicle and around engine for wet spots or buildup.',
        redFlagSigns: ['Active dripping', 'Oil-soaked ground under vehicle', 'Heavy buildup on engine']
    },
    {
        category: 'engine',
        item: 'Listen for unusual engine noises',
        priority: 'critical',
        whatToLookFor: 'Engine should run smoothly without knocking, ticking, or whining.',
        redFlagSigns: ['Rod knock (deep thudding)', 'Timing chain rattle', 'Continuous ticking']
    },
    {
        category: 'engine',
        item: 'Check for smoke from exhaust',
        priority: 'critical',
        whatToLookFor: 'Brief steam on cold start is normal. Smoke should clear quickly.',
        redFlagSigns: ['Blue smoke (burning oil)', 'White smoke (coolant leak)', 'Black smoke (running rich)']
    },

    // Transmission
    {
        category: 'transmission',
        item: 'Check transmission fluid (if accessible)',
        priority: 'critical',
        whatToLookFor: 'Should be red/pink and clean. Dark brown or burnt smell indicates problems.',
        redFlagSigns: ['Burnt smell', 'Dark brown/black color', 'Metal particles']
    },
    {
        category: 'transmission',
        item: 'Test all gears',
        priority: 'critical',
        whatToLookFor: 'Shifts should be smooth without hesitation or hard jerks.',
        redFlagSigns: ['Delayed engagement', 'Hard shifting', 'Slipping between gears']
    },

    // Brakes
    {
        category: 'brakes',
        item: 'Inspect brake pads and rotors',
        priority: 'critical',
        whatToLookFor: 'Pads should have at least 3mm of material. Rotors should be smooth.',
        redFlagSigns: ['Metal-on-metal grinding', 'Grooved or warped rotors', 'Visible pad wear indicator']
    },
    {
        category: 'brakes',
        item: 'Check brake fluid level and color',
        priority: 'important',
        whatToLookFor: 'Should be clear to light amber. Dark fluid indicates contamination.',
        redFlagSigns: ['Low fluid level', 'Dark or murky fluid']
    },
    {
        category: 'brakes',
        item: 'Test brake pedal feel',
        priority: 'critical',
        whatToLookFor: 'Pedal should be firm and engage about midway. Should not feel spongy.',
        redFlagSigns: ['Spongy pedal', 'Pedal goes to floor', 'Pulsating pedal']
    },

    // Suspension
    {
        category: 'suspension',
        item: 'Check for uneven tire wear',
        priority: 'important',
        whatToLookFor: 'Wear should be even across the tread. Uneven wear indicates alignment or suspension issues.',
        redFlagSigns: ['Inner/outer edge wear', 'Cupping or scalloping', 'Feathering']
    },
    {
        category: 'suspension',
        item: 'Push down on each corner',
        priority: 'recommended',
        whatToLookFor: 'Vehicle should bounce once and settle. More than one bounce indicates worn shocks.',
        redFlagSigns: ['Excessive bouncing', 'Clunking sounds', 'Vehicle doesn\'t level out']
    },
    {
        category: 'suspension',
        item: 'Check for leaking shocks/struts',
        priority: 'important',
        whatToLookFor: 'Look for oil residue on shock absorbers.',
        redFlagSigns: ['Oil leaking from shocks', 'Wet shock bodies']
    },

    // Electrical
    {
        category: 'electrical',
        item: 'Test all lights',
        priority: 'important',
        whatToLookFor: 'Headlights, taillights, brake lights, turn signals, reverse lights.',
        redFlagSigns: ['Non-working lights', 'Dim or flickering lights']
    },
    {
        category: 'electrical',
        item: 'Check battery terminals',
        priority: 'recommended',
        whatToLookFor: 'Terminals should be clean without corrosion.',
        redFlagSigns: ['Heavy corrosion', 'Loose connections', 'Battery age > 4 years']
    },
    {
        category: 'electrical',
        item: 'Test power windows and locks',
        priority: 'recommended',
        whatToLookFor: 'All should operate smoothly without grinding.',
        redFlagSigns: ['Slow or stuck windows', 'Non-working locks', 'Grinding noises']
    },
    {
        category: 'electrical',
        item: 'Check all dashboard warning lights',
        priority: 'critical',
        whatToLookFor: 'Start car - all lights should come on then turn off. None should stay on.',
        redFlagSigns: ['Check engine light on', 'ABS light on', 'Airbag light on']
    },

    // Body
    {
        category: 'body',
        item: 'Check for accident damage/repair',
        priority: 'critical',
        whatToLookFor: 'Look for misaligned panels, paint overspray, and uneven gaps.',
        redFlagSigns: ['Panel gaps vary', 'Paint texture differences', 'Welding marks in trunk']
    },
    {
        category: 'body',
        item: 'Inspect for rust',
        priority: 'important',
        whatToLookFor: 'Check wheel wells, rocker panels, door bottoms, and underbody.',
        redFlagSigns: ['Bubbling paint', 'Holes in metal', 'Extensive underbody rust']
    },
    {
        category: 'body',
        item: 'Check all doors, hood, and trunk',
        priority: 'recommended',
        whatToLookFor: 'Should open and close smoothly without sticking.',
        redFlagSigns: ['Doors don\'t align', 'Hard to close', 'Gaps between panels']
    },

    // Fluid
    {
        category: 'fluid',
        item: 'Check coolant level and condition',
        priority: 'critical',
        whatToLookFor: 'Should be at proper level, clean color (usually green, orange, or pink).',
        redFlagSigns: ['Low level', 'Rusty or brown coolant', 'Oil in coolant']
    },
    {
        category: 'fluid',
        item: 'Check power steering fluid',
        priority: 'recommended',
        whatToLookFor: 'Should be at proper level, clean and clear.',
        redFlagSigns: ['Low level', 'Dark or burnt fluid']
    },

    // Interior
    {
        category: 'interior',
        item: 'Check for water damage/leaks',
        priority: 'important',
        whatToLookFor: 'Feel carpets for dampness, check for water stains on headliner.',
        redFlagSigns: ['Musty smell', 'Wet carpets', 'Water stains']
    },
    {
        category: 'interior',
        item: 'Test A/C and heater',
        priority: 'important',
        whatToLookFor: 'A/C should blow cold quickly. Heater should get hot.',
        redFlagSigns: ['Weak A/C', 'Bad smell from vents', 'No heat']
    },

    // Exhaust
    {
        category: 'exhaust',
        item: 'Check exhaust system',
        priority: 'recommended',
        whatToLookFor: 'Look for rust, holes, or hanging components.',
        redFlagSigns: ['Loud exhaust', 'Visible holes', 'Exhaust smell in cabin']
    },
];

// Test drive checklist
const STANDARD_TEST_DRIVE_CHECKLIST = [
    'Cold start the engine - listen for unusual noises',
    'Test acceleration from 0-40 mph - should be smooth',
    'Highway driving at 65+ mph - check for vibrations',
    'Test braking at various speeds - should be straight and smooth',
    'Make tight turns in both directions - listen for clicking or grinding',
    'Drive over bumps - suspension should absorb without excessive noise',
    'Test all transmission gears including reverse',
    'Park on an incline and test parking brake',
    'Test cruise control if equipped',
    'Listen for wind noise at highway speeds - may indicate poor seals',
];

// Documents to request
const STANDARD_DOCUMENTS = [
    'Vehicle title (check for liens, salvage brand)',
    'Service records/maintenance history',
    'Carfax or AutoCheck report',
    'State inspection records (if applicable)',
    'Warranty documentation (if applicable)',
    'Bill of sale with complete seller information',
];

// Tools needed for inspection
const TOOLS_NEEDED = [
    'Flashlight (for looking under vehicle/engine bay)',
    'Paper towel (for checking fluid conditions)',
    'Magnet (to detect body filler - won\'t stick to filler)',
    'OBD-II scanner (to check for codes)',
    'Phone with camera (to document condition)',
];

/**
 * Map known issues to specific inspection items
 */
function mapKnownIssuesToInspectionItems(knownIssues: KnownIssue[]): InspectionItem[] {
    const items: InspectionItem[] = [];

    for (const issue of knownIssues) {
        const category = issue.component as InspectionCategory;

        items.push({
            category,
            item: `Check for: ${issue.description.split(' - ')[0]}`,
            priority: issue.severity === 'critical' || issue.severity === 'major' ? 'critical' : 'important',
            reason: `Known issue for this model year`,
            whatToLookFor: issue.description,
            redFlagSigns: [
                `Signs of ${issue.component} problems`,
                `Repair cost: $${issue.repairCost.low.toLocaleString()}-$${issue.repairCost.high.toLocaleString()}`
            ]
        });
    }

    return items;
}

/**
 * Map red flags to specific inspection items
 */
function mapRedFlagsToInspectionItems(redFlags: RedFlag[]): InspectionItem[] {
    const items: InspectionItem[] = [];
    const seenItems = new Set<string>();

    for (const flag of redFlags) {
        // Skip if we've already added this type
        if (seenItems.has(flag.type)) continue;
        seenItems.add(flag.type);

        // Map specific red flag types to inspection items
        if (flag.type === 'damage_history' || flag.message.toLowerCase().includes('flood')) {
            items.push({
                category: 'body',
                item: 'Detailed flood/water damage inspection',
                priority: 'critical',
                reason: flag.message,
                whatToLookFor: 'Check for water lines, rust in hidden areas, musty smell, electrical issues',
                redFlagSigns: [
                    'Mud or debris in crevices',
                    'Corrosion under dashboard',
                    'Fogged headlight lenses',
                    'Musty or moldy smell',
                    'Mismatched carpet or upholstery'
                ]
            });
        }

        if (flag.type === 'title_issue') {
            items.push({
                category: 'body',
                item: 'Thorough frame and structural inspection',
                priority: 'critical',
                reason: flag.message,
                whatToLookFor: 'Check frame rails, structural welds, and evidence of major repairs',
                redFlagSigns: [
                    'Fresh undercoating hiding repairs',
                    'Misaligned panels',
                    'Kinked or bent frame rails',
                    'Evidence of welding repairs'
                ]
            });
        }

        if (flag.type === 'mechanical_issue') {
            items.push({
                category: 'engine',
                item: 'Extended mechanical inspection',
                priority: 'critical',
                reason: flag.message,
                whatToLookFor: 'Comprehensive engine and drivetrain inspection by qualified mechanic',
                redFlagSigns: [
                    'Unusual noises',
                    'Poor performance',
                    'Excessive smoke',
                    'Check engine light'
                ]
            });
        }

        if (flag.message.toLowerCase().includes('odometer')) {
            items.push({
                category: 'interior',
                item: 'Odometer verification',
                priority: 'critical',
                reason: flag.message,
                whatToLookFor: 'Compare wear patterns to claimed mileage',
                redFlagSigns: [
                    'Excessive pedal wear for claimed mileage',
                    'Worn steering wheel/seats with low mileage',
                    'Service stickers with higher mileage',
                    'Digital odometer glitches'
                ]
            });
        }
    }

    return items;
}

/**
 * Generate a complete inspection checklist for a specific vehicle
 */
export function generateInspectionChecklist(
    make: string,
    model: string,
    year: number,
    knownIssues: KnownIssue[] = [],
    redFlags: RedFlag[] = []
): InspectionChecklist {
    // Generate vehicle-specific items from known issues and red flags
    const knownIssueItems = mapKnownIssuesToInspectionItems(knownIssues);
    const redFlagItems = mapRedFlagsToInspectionItems(redFlags);

    // Combine and deduplicate vehicle-specific items
    const vehicleSpecificItems = [...knownIssueItems, ...redFlagItems];

    // Add year-specific inspection items
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - year;

    if (vehicleAge > 10) {
        vehicleSpecificItems.push({
            category: 'body',
            item: 'Thorough rust inspection',
            priority: 'important',
            reason: 'Vehicle is 10+ years old',
            whatToLookFor: 'Check all common rust areas: wheel wells, rocker panels, floor pans',
            redFlagSigns: ['Perforation rust', 'Bubbling under paint', 'Structural rust']
        });
    }

    if (vehicleAge > 7) {
        vehicleSpecificItems.push({
            category: 'electrical',
            item: 'Battery and charging system test',
            priority: 'important',
            reason: 'Vehicle is 7+ years old',
            whatToLookFor: 'Test battery health and alternator output',
            redFlagSigns: ['Low CCA reading', 'Voltage drop under load']
        });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, important: 1, recommended: 2 };
    vehicleSpecificItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Estimate inspection time
    const estimatedTime = vehicleSpecificItems.length > 5
        ? '90-120 minutes'
        : vehicleSpecificItems.length > 2
            ? '60-90 minutes'
            : '45-60 minutes';

    return {
        vehicleSpecificItems,
        standardItems: STANDARD_INSPECTION_ITEMS,
        testDriveChecklist: STANDARD_TEST_DRIVE_CHECKLIST,
        documentsToRequest: STANDARD_DOCUMENTS,
        toolsNeeded: TOOLS_NEEDED,
        estimatedInspectionTime: estimatedTime
    };
}

/**
 * Get a condensed summary of critical inspection items
 */
export function getCriticalInspectionSummary(checklist: InspectionChecklist): string[] {
    const criticalItems = [
        ...checklist.vehicleSpecificItems.filter(i => i.priority === 'critical'),
        ...checklist.standardItems.filter(i => i.priority === 'critical')
    ];

    return criticalItems.slice(0, 8).map(i => i.item);
}

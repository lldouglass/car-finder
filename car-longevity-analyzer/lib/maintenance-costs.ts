/**
 * Maintenance Cost Projection
 * Estimates annual maintenance costs and upcoming maintenance items
 */

import type { KnownIssue } from './reliability-data';

export type VehicleCategory = 'economy' | 'standard' | 'premium' | 'luxury';

export interface UpcomingMaintenanceItem {
    item: string;
    mileageRange: string;
    estimatedCost: { low: number; high: number };
    urgency: 'due_now' | 'upcoming' | 'future';
}

export interface KnownIssueRisk {
    issue: string;
    probability: string;
    cost: { low: number; high: number };
    mileageRange: string;
}

export interface MaintenanceCostEstimate {
    estimatedAnnualCost: { low: number; high: number };
    category: VehicleCategory;
    categoryLabel: string;
    upcomingMaintenance: UpcomingMaintenanceItem[];
    knownIssueRisks: KnownIssueRisk[];
    fiveYearProjection: { low: number; high: number };
    costFactors: string[];
}

// Base annual maintenance costs by vehicle category
const BASE_ANNUAL_COSTS: Record<VehicleCategory, { low: number; high: number }> = {
    economy: { low: 400, high: 600 },     // Toyota, Honda, Mazda, Hyundai, Kia
    standard: { low: 500, high: 800 },    // Ford, Chevy, Nissan, Subaru
    premium: { low: 700, high: 1100 },    // Acura, Lexus, Infiniti, Buick
    luxury: { low: 1200, high: 2000 },    // BMW, Mercedes, Audi, Porsche, Land Rover
};

// Brand to category mapping
const BRAND_CATEGORIES: Record<string, VehicleCategory> = {
    // Economy
    'toyota': 'economy',
    'honda': 'economy',
    'mazda': 'economy',
    'hyundai': 'economy',
    'kia': 'economy',
    'mitsubishi': 'economy',
    'scion': 'economy',

    // Standard
    'ford': 'standard',
    'chevrolet': 'standard',
    'chevy': 'standard',
    'gmc': 'standard',
    'dodge': 'standard',
    'chrysler': 'standard',
    'jeep': 'standard',
    'ram': 'standard',
    'nissan': 'standard',
    'subaru': 'standard',
    'volkswagen': 'standard',
    'vw': 'standard',
    'mini': 'standard',

    // Premium
    'acura': 'premium',
    'lexus': 'premium',
    'infiniti': 'premium',
    'genesis': 'premium',
    'buick': 'premium',
    'lincoln': 'premium',
    'cadillac': 'premium',
    'volvo': 'premium',
    'alfa romeo': 'premium',

    // Luxury
    'bmw': 'luxury',
    'mercedes': 'luxury',
    'mercedes-benz': 'luxury',
    'audi': 'luxury',
    'porsche': 'luxury',
    'land rover': 'luxury',
    'range rover': 'luxury',
    'jaguar': 'luxury',
    'maserati': 'luxury',
    'bentley': 'luxury',
    'rolls-royce': 'luxury',
    'ferrari': 'luxury',
    'lamborghini': 'luxury',
    'aston martin': 'luxury',
    'tesla': 'premium', // Lower maintenance but premium parts
};

// Standard maintenance schedule items
const STANDARD_MAINTENANCE_ITEMS = [
    { item: 'Oil change', intervalMiles: 5000, cost: { low: 40, high: 120 } },
    { item: 'Tire rotation', intervalMiles: 7500, cost: { low: 25, high: 50 } },
    { item: 'Air filter replacement', intervalMiles: 25000, cost: { low: 20, high: 75 } },
    { item: 'Cabin air filter', intervalMiles: 25000, cost: { low: 25, high: 80 } },
    { item: 'Brake pad replacement (front)', intervalMiles: 50000, cost: { low: 150, high: 400 } },
    { item: 'Brake pad replacement (rear)', intervalMiles: 60000, cost: { low: 150, high: 400 } },
    { item: 'Transmission fluid change', intervalMiles: 60000, cost: { low: 100, high: 300 } },
    { item: 'Coolant flush', intervalMiles: 60000, cost: { low: 100, high: 200 } },
    { item: 'Spark plug replacement', intervalMiles: 80000, cost: { low: 100, high: 400 } },
    { item: 'Timing belt replacement', intervalMiles: 90000, cost: { low: 500, high: 1000 } },
    { item: 'Brake rotor replacement', intervalMiles: 80000, cost: { low: 300, high: 800 } },
    { item: 'Battery replacement', intervalMiles: 50000, cost: { low: 100, high: 300 } },
    { item: 'Tire replacement (set of 4)', intervalMiles: 50000, cost: { low: 400, high: 1200 } },
];

/**
 * Determines vehicle category based on make
 */
export function getVehicleCategory(make: string): VehicleCategory {
    const normalizedMake = make.toLowerCase().trim();
    return BRAND_CATEGORIES[normalizedMake] || 'standard';
}

/**
 * Gets category label for display
 */
function getCategoryLabel(category: VehicleCategory): string {
    const labels: Record<VehicleCategory, string> = {
        economy: 'Economy (Low Cost)',
        standard: 'Standard (Moderate Cost)',
        premium: 'Premium (Higher Cost)',
        luxury: 'Luxury (High Cost)'
    };
    return labels[category];
}

/**
 * Calculates cost multiplier based on vehicle age
 */
function getAgeCostMultiplier(vehicleAge: number): number {
    // Older vehicles need more maintenance
    if (vehicleAge <= 3) return 0.8;   // Under warranty, less maintenance
    if (vehicleAge <= 6) return 1.0;   // Normal maintenance
    if (vehicleAge <= 10) return 1.3;  // More frequent repairs
    if (vehicleAge <= 15) return 1.6;  // Aging parts
    return 2.0;                         // Elderly vehicle
}

/**
 * Calculates cost multiplier based on mileage
 */
function getMileageCostMultiplier(mileage: number): number {
    if (mileage < 50000) return 0.85;
    if (mileage < 100000) return 1.0;
    if (mileage < 150000) return 1.25;
    if (mileage < 200000) return 1.5;
    return 1.75;
}

/**
 * Determines urgency of maintenance based on current mileage
 */
function getMaintenanceUrgency(
    currentMileage: number,
    intervalMiles: number
): 'due_now' | 'upcoming' | 'future' {
    const nextDue = Math.ceil(currentMileage / intervalMiles) * intervalMiles;
    const milesUntilDue = nextDue - currentMileage;

    if (milesUntilDue <= 1000) return 'due_now';
    if (milesUntilDue <= 5000) return 'upcoming';
    return 'future';
}

/**
 * Calculate upcoming maintenance items based on current mileage
 */
function calculateUpcomingMaintenance(
    currentMileage: number,
    category: VehicleCategory
): UpcomingMaintenanceItem[] {
    const items: UpcomingMaintenanceItem[] = [];
    const costMultiplier = category === 'luxury' ? 2.0 :
                          category === 'premium' ? 1.5 :
                          category === 'standard' ? 1.2 : 1.0;

    for (const item of STANDARD_MAINTENANCE_ITEMS) {
        const urgency = getMaintenanceUrgency(currentMileage, item.intervalMiles);

        // Only include items that are due now or upcoming
        if (urgency === 'due_now' || urgency === 'upcoming') {
            const nextDue = Math.ceil(currentMileage / item.intervalMiles) * item.intervalMiles;

            items.push({
                item: item.item,
                mileageRange: `${nextDue.toLocaleString()} miles`,
                estimatedCost: {
                    low: Math.round(item.cost.low * costMultiplier),
                    high: Math.round(item.cost.high * costMultiplier)
                },
                urgency
            });
        }
    }

    // Sort by urgency (due_now first, then upcoming)
    items.sort((a, b) => {
        const order = { due_now: 0, upcoming: 1, future: 2 };
        return order[a.urgency] - order[b.urgency];
    });

    return items.slice(0, 5); // Return top 5 most urgent
}

/**
 * Calculate known issue risks based on current mileage and vehicle year
 */
function calculateKnownIssueRisks(
    knownIssues: KnownIssue[],
    currentMileage: number,
    vehicleYear: number
): KnownIssueRisk[] {
    const risks: KnownIssueRisk[] = [];

    for (const issue of knownIssues) {
        // Check if vehicle year is in affected years
        if (issue.affectedYears && !issue.affectedYears.includes(vehicleYear)) {
            continue;
        }

        // Check if mileage is in the risk window
        const { start, end } = issue.mileageRange;
        let probability: string;
        let shouldInclude = false;

        if (currentMileage >= start && currentMileage <= end) {
            // Currently in the risk window
            probability = issue.severity === 'critical' ? 'High - In affected mileage range' :
                         issue.severity === 'major' ? 'Moderate - In affected mileage range' :
                         'Low - In affected mileage range';
            shouldInclude = true;
        } else if (currentMileage < start && start - currentMileage < 30000) {
            // Approaching risk window
            probability = 'Upcoming - Approaching affected mileage';
            shouldInclude = true;
        }

        if (shouldInclude) {
            risks.push({
                issue: issue.description,
                probability,
                cost: issue.repairCost,
                mileageRange: `${start.toLocaleString()} - ${end.toLocaleString()} miles`
            });
        }
    }

    return risks;
}

/**
 * Main function to calculate maintenance cost estimates
 */
export function calculateMaintenanceCosts(
    make: string,
    model: string,
    year: number,
    currentMileage: number,
    knownIssues: KnownIssue[] = []
): MaintenanceCostEstimate {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - year;

    // Determine vehicle category
    const category = getVehicleCategory(make);
    const baseCosts = BASE_ANNUAL_COSTS[category];

    // Calculate multipliers
    const ageMultiplier = getAgeCostMultiplier(vehicleAge);
    const mileageMultiplier = getMileageCostMultiplier(currentMileage);
    const combinedMultiplier = (ageMultiplier + mileageMultiplier) / 2;

    // Calculate annual costs
    const estimatedAnnualCost = {
        low: Math.round(baseCosts.low * combinedMultiplier),
        high: Math.round(baseCosts.high * combinedMultiplier)
    };

    // Calculate upcoming maintenance
    const upcomingMaintenance = calculateUpcomingMaintenance(currentMileage, category);

    // Calculate known issue risks
    const knownIssueRisks = calculateKnownIssueRisks(knownIssues, currentMileage, year);

    // Calculate 5-year projection
    const fiveYearProjection = {
        low: estimatedAnnualCost.low * 5,
        high: estimatedAnnualCost.high * 5
    };

    // Add known issue costs to projection if applicable
    for (const risk of knownIssueRisks) {
        // Add a portion of potential repair costs to 5-year estimate
        fiveYearProjection.low += Math.round(risk.cost.low * 0.3);
        fiveYearProjection.high += Math.round(risk.cost.high * 0.7);
    }

    // Generate cost factors explanation
    const costFactors: string[] = [];
    if (vehicleAge > 10) costFactors.push('Higher costs due to vehicle age (10+ years)');
    if (currentMileage > 100000) costFactors.push('Higher costs due to high mileage (100k+)');
    if (category === 'luxury') costFactors.push('Luxury brand parts and service premiums');
    if (category === 'premium') costFactors.push('Premium brand maintenance costs');
    if (knownIssueRisks.length > 0) costFactors.push(`${knownIssueRisks.length} known issue(s) may require attention`);
    if (upcomingMaintenance.some(m => m.urgency === 'due_now')) {
        costFactors.push('Immediate maintenance items due now');
    }

    if (costFactors.length === 0) {
        costFactors.push('Standard maintenance costs expected');
    }

    return {
        estimatedAnnualCost,
        category,
        categoryLabel: getCategoryLabel(category),
        upcomingMaintenance,
        knownIssueRisks,
        fiveYearProjection,
        costFactors
    };
}

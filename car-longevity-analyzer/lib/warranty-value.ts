/**
 * Warranty Value Calculator
 * Calculates the value of remaining warranty coverage
 */

import { getVehicleCategory, type VehicleCategory } from './maintenance-costs';

export type WarrantyType =
    | 'factory_full'        // Full factory bumper-to-bumper warranty
    | 'factory_powertrain'  // Factory powertrain-only warranty
    | 'cpo'                 // Certified Pre-Owned warranty
    | 'third_party'         // Third-party extended warranty
    | 'none'                // No warranty
    | 'unknown';

export interface WarrantyInfo {
    type: WarrantyType;
    monthsRemaining?: number;
    milesRemaining?: number;
    coverage?: string[];    // What's covered (if known)
    provider?: string;      // Warranty provider name
}

export interface WarrantyValueResult {
    estimatedValue: { low: number; high: number };
    valueExplanation: string;
    recommendation: string;
    coverageQuality: 'excellent' | 'good' | 'limited' | 'none';
    equivalentExtendedWarrantyCost: { low: number; high: number };
    warrantyTips: string[];
}

// Value per month of remaining coverage by warranty type
const WARRANTY_VALUES_PER_MONTH: Record<WarrantyType, { low: number; high: number }> = {
    factory_full: { low: 100, high: 180 },
    factory_powertrain: { low: 50, high: 100 },
    cpo: { low: 80, high: 150 },
    third_party: { low: 25, high: 60 },
    none: { low: 0, high: 0 },
    unknown: { low: 0, high: 0 },
};

// Value per 1000 miles of remaining coverage
const WARRANTY_VALUES_PER_1K_MILES: Record<WarrantyType, { low: number; high: number }> = {
    factory_full: { low: 12, high: 20 },
    factory_powertrain: { low: 6, high: 12 },
    cpo: { low: 10, high: 16 },
    third_party: { low: 3, high: 8 },
    none: { low: 0, high: 0 },
    unknown: { low: 0, high: 0 },
};

// Multipliers for vehicle category (luxury vehicles = more valuable warranty)
const CATEGORY_MULTIPLIERS: Record<VehicleCategory, number> = {
    economy: 0.8,
    standard: 1.0,
    premium: 1.4,
    luxury: 2.0,
};

// Cost of equivalent extended warranty coverage (per year)
const EXTENDED_WARRANTY_COSTS: Record<VehicleCategory, { low: number; high: number }> = {
    economy: { low: 800, high: 1500 },
    standard: { low: 1200, high: 2000 },
    premium: { low: 1800, high: 3000 },
    luxury: { low: 2500, high: 5000 },
};

/**
 * Get human-readable label for warranty type
 */
export function getWarrantyTypeLabel(type: WarrantyType): string {
    const labels: Record<WarrantyType, string> = {
        factory_full: 'Factory Full Coverage',
        factory_powertrain: 'Factory Powertrain Only',
        cpo: 'Certified Pre-Owned',
        third_party: 'Third-Party Extended',
        none: 'No Warranty',
        unknown: 'Unknown Coverage'
    };
    return labels[type];
}

/**
 * Determines coverage quality based on warranty type and remaining coverage
 */
function getCoverageQuality(
    warranty: WarrantyInfo
): 'excellent' | 'good' | 'limited' | 'none' {
    if (warranty.type === 'none' || warranty.type === 'unknown') {
        return 'none';
    }

    const hasSignificantTime = (warranty.monthsRemaining ?? 0) >= 12;
    const hasSignificantMiles = (warranty.milesRemaining ?? 0) >= 12000;

    if (warranty.type === 'factory_full' && hasSignificantTime && hasSignificantMiles) {
        return 'excellent';
    }

    if ((warranty.type === 'factory_full' || warranty.type === 'cpo') &&
        (hasSignificantTime || hasSignificantMiles)) {
        return 'good';
    }

    if (warranty.type === 'third_party') {
        return 'limited';
    }

    return 'limited';
}

/**
 * Calculate the monetary value of remaining warranty coverage
 */
export function calculateWarrantyValue(
    warranty: WarrantyInfo,
    make: string
): WarrantyValueResult {
    const category = getVehicleCategory(make);
    const multiplier = CATEGORY_MULTIPLIERS[category];

    // Handle no warranty case
    if (warranty.type === 'none' || warranty.type === 'unknown') {
        return {
            estimatedValue: { low: 0, high: 0 },
            valueExplanation: warranty.type === 'none'
                ? 'Vehicle has no warranty coverage. You will be responsible for all repairs.'
                : 'Warranty status unknown. Verify coverage before purchase.',
            recommendation: 'Consider purchasing an extended warranty or setting aside a repair fund.',
            coverageQuality: 'none',
            equivalentExtendedWarrantyCost: EXTENDED_WARRANTY_COSTS[category],
            warrantyTips: [
                'Get the vehicle inspected before purchase',
                'Set aside $2,000-5,000 for potential repairs',
                'Research extended warranty options if buying'
            ]
        };
    }

    // Calculate value based on time and mileage (whichever is lower)
    const monthsRemaining = warranty.monthsRemaining ?? 0;
    const milesRemaining = warranty.milesRemaining ?? 0;

    const monthValues = WARRANTY_VALUES_PER_MONTH[warranty.type];
    const mileValues = WARRANTY_VALUES_PER_1K_MILES[warranty.type];

    const valueFromMonths = {
        low: monthsRemaining * monthValues.low * multiplier,
        high: monthsRemaining * monthValues.high * multiplier
    };

    const valueFromMiles = {
        low: (milesRemaining / 1000) * mileValues.low * multiplier,
        high: (milesRemaining / 1000) * mileValues.high * multiplier
    };

    // Use the lower of the two (warranty expires on either trigger)
    const estimatedValue = {
        low: Math.round(Math.min(valueFromMonths.low, valueFromMiles.low)),
        high: Math.round(Math.min(valueFromMonths.high, valueFromMiles.high))
    };

    // Generate explanation
    let valueExplanation: string;
    if (monthsRemaining > 0 && milesRemaining > 0) {
        valueExplanation = `Approximately ${monthsRemaining} months or ${milesRemaining.toLocaleString()} miles remaining. ` +
            `This ${getWarrantyTypeLabel(warranty.type).toLowerCase()} coverage has significant value.`;
    } else if (monthsRemaining > 0) {
        valueExplanation = `Approximately ${monthsRemaining} months of coverage remaining.`;
    } else if (milesRemaining > 0) {
        valueExplanation = `Approximately ${milesRemaining.toLocaleString()} miles of coverage remaining.`;
    } else {
        valueExplanation = 'Limited warranty information available. Verify exact terms.';
    }

    // Generate recommendation
    let recommendation: string;
    const coverageQuality = getCoverageQuality(warranty);

    if (coverageQuality === 'excellent') {
        recommendation = 'Excellent coverage! This warranty adds significant value to the vehicle and protects against major repairs.';
    } else if (coverageQuality === 'good') {
        recommendation = 'Good coverage that provides meaningful protection. Factor this into your price negotiation.';
    } else {
        recommendation = 'Limited coverage. Verify exactly what is and isn\'t covered before purchase.';
    }

    // Generate warranty tips
    const warrantyTips: string[] = [];

    if (warranty.type === 'factory_full' || warranty.type === 'factory_powertrain') {
        warrantyTips.push('Factory warranty transfers to new owner automatically');
        warrantyTips.push('Keep all service records to maintain warranty validity');
    }

    if (warranty.type === 'cpo') {
        warrantyTips.push('CPO warranty is backed by the manufacturer');
        warrantyTips.push('Get the CPO inspection report and coverage details in writing');
    }

    if (warranty.type === 'third_party') {
        warrantyTips.push('Research the warranty company\'s reputation and claims process');
        warrantyTips.push('Read the fine print - many exclusions may apply');
        warrantyTips.push('Verify the warranty is transferable to you as the new owner');
        warrantyTips.push('Be wary of "bumper-to-bumper" claims that have many exclusions');
    }

    if (monthsRemaining < 6 || milesRemaining < 5000) {
        warrantyTips.push('Limited coverage remaining - consider this in negotiations');
    }

    return {
        estimatedValue,
        valueExplanation,
        recommendation,
        coverageQuality,
        equivalentExtendedWarrantyCost: EXTENDED_WARRANTY_COSTS[category],
        warrantyTips
    };
}

/**
 * Detect warranty information from listing text
 */
export function detectWarrantyFromListing(listingText: string): WarrantyInfo {
    const text = listingText.toLowerCase();

    // CPO detection
    if (/certified\s*pre[\s-]*owned|cpo\b/i.test(text)) {
        return { type: 'cpo' };
    }

    // Factory warranty detection
    if (/factory\s*warranty|manufacturer'?s?\s*warranty|original\s*warranty/i.test(text)) {
        if (/bumper[\s-]*to[\s-]*bumper|full\s*coverage|comprehensive/i.test(text)) {
            return { type: 'factory_full' };
        }
        if (/powertrain|drivetrain|engine\s*(and|&)\s*transmission/i.test(text)) {
            return { type: 'factory_powertrain' };
        }
        return { type: 'factory_powertrain' }; // Default to powertrain if unspecified
    }

    // Extended warranty detection
    if (/extended\s*warranty|aftermarket\s*warranty|service\s*contract/i.test(text)) {
        return { type: 'third_party' };
    }

    // No warranty indicators
    if (/as[\s-]*is|no\s*warranty|sold\s*as[\s-]*is|buyer\s*beware/i.test(text)) {
        return { type: 'none' };
    }

    // Try to extract remaining warranty time/miles
    const monthsMatch = text.match(/(\d+)\s*months?\s*(of\s*)?(warranty|remaining|left)/i);
    const milesMatch = text.match(/(\d{1,3},?\d{3})\s*miles?\s*(of\s*)?(warranty|remaining|left)/i);

    if (monthsMatch || milesMatch) {
        return {
            type: 'unknown',
            monthsRemaining: monthsMatch ? parseInt(monthsMatch[1]) : undefined,
            milesRemaining: milesMatch ? parseInt(milesMatch[1].replace(',', '')) : undefined
        };
    }

    return { type: 'unknown' };
}

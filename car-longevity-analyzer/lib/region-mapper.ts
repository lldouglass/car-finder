/**
 * Region Mapper
 * Maps US state codes to climate regions for lifespan calculations
 */

import type { ClimateRegion } from './lifespan-factors';

// State to climate region mapping
const STATE_CLIMATE_MAP: Record<string, ClimateRegion> = {
    // Rust Belt - Heavy road salt usage
    OH: 'rust_belt',
    MI: 'rust_belt',
    PA: 'rust_belt',
    NY: 'rust_belt',
    IN: 'rust_belt',
    IL: 'rust_belt',
    WI: 'rust_belt',
    MN: 'rust_belt',
    IA: 'rust_belt',
    WV: 'rust_belt',

    // Extreme Heat
    AZ: 'extreme_heat',
    NV: 'extreme_heat',
    NM: 'extreme_heat',

    // Extreme Cold (not rust belt - less salt or dry snow)
    AK: 'extreme_cold',
    MT: 'extreme_cold',
    ND: 'extreme_cold',
    SD: 'extreme_cold',
    WY: 'extreme_cold',

    // Coastal Salt Air
    FL: 'coastal_salt',
    HI: 'coastal_salt',
    // Note: Other coastal states have less salt air impact

    // Moderate Climate
    CA: 'moderate',
    OR: 'moderate',
    WA: 'moderate',
    NC: 'moderate',
    GA: 'moderate',
    TN: 'moderate',
    VA: 'moderate',
    SC: 'moderate',
    AL: 'moderate',
    KY: 'moderate',
    MD: 'moderate',
    AR: 'moderate',
    LA: 'moderate',
    MS: 'moderate',
    OK: 'moderate',
    KS: 'moderate',
    NE: 'moderate',
    MO: 'moderate',
    TX: 'moderate', // Parts are extreme heat but overall moderate
    CO: 'moderate',
    UT: 'moderate',
    ID: 'moderate',
    NJ: 'moderate', // Could be rust belt too
    CT: 'moderate',
    MA: 'moderate',
    RI: 'moderate',
    NH: 'moderate',
    VT: 'moderate',
    ME: 'moderate',
    DE: 'moderate',
    DC: 'moderate',
};

/**
 * Gets the climate region for a given US state code.
 * @param stateCode - Two-letter US state code (e.g., 'CA', 'NY')
 * @returns Climate region or 'unknown' if state not found
 */
export function getClimateRegion(stateCode: string | undefined): ClimateRegion {
    if (!stateCode) return 'unknown';

    const normalized = stateCode.toUpperCase().trim();

    // Handle full state names
    const stateNameToCode = STATE_NAMES_TO_CODES[normalized];
    const code = stateNameToCode || normalized;

    return STATE_CLIMATE_MAP[code] || 'unknown';
}

// State names to codes for convenience
const STATE_NAMES_TO_CODES: Record<string, string> = {
    'ALABAMA': 'AL',
    'ALASKA': 'AK',
    'ARIZONA': 'AZ',
    'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA',
    'COLORADO': 'CO',
    'CONNECTICUT': 'CT',
    'DELAWARE': 'DE',
    'FLORIDA': 'FL',
    'GEORGIA': 'GA',
    'HAWAII': 'HI',
    'IDAHO': 'ID',
    'ILLINOIS': 'IL',
    'INDIANA': 'IN',
    'IOWA': 'IA',
    'KANSAS': 'KS',
    'KENTUCKY': 'KY',
    'LOUISIANA': 'LA',
    'MAINE': 'ME',
    'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA',
    'MICHIGAN': 'MI',
    'MINNESOTA': 'MN',
    'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO',
    'MONTANA': 'MT',
    'NEBRASKA': 'NE',
    'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    'OHIO': 'OH',
    'OKLAHOMA': 'OK',
    'OREGON': 'OR',
    'PENNSYLVANIA': 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    'TENNESSEE': 'TN',
    'TEXAS': 'TX',
    'UTAH': 'UT',
    'VERMONT': 'VT',
    'VIRGINIA': 'VA',
    'WASHINGTON': 'WA',
    'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI',
    'WYOMING': 'WY',
    'DISTRICT OF COLUMBIA': 'DC',
};

/**
 * Gets human-readable description of climate region impact
 */
export function getClimateDescription(region: ClimateRegion): string {
    const descriptions: Record<ClimateRegion, string> = {
        rust_belt: 'High road salt usage leads to accelerated corrosion and undercarriage wear',
        extreme_heat: 'Extreme temperatures stress cooling systems, batteries, and rubber components',
        extreme_cold: 'Cold weather impacts batteries, fluids, and causes thermal cycling stress',
        coastal_salt: 'Salt air accelerates corrosion, particularly on electrical connections',
        moderate: 'Favorable climate conditions for vehicle longevity',
        unknown: 'Climate impact unknown',
    };
    return descriptions[region];
}

/**
 * Returns all states in a given climate region
 */
export function getStatesInRegion(region: ClimateRegion): string[] {
    return Object.entries(STATE_CLIMATE_MAP)
        .filter(([_, r]) => r === region)
        .map(([state]) => state);
}

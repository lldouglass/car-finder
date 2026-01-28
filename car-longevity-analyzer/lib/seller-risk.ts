/**
 * Seller Type Risk Assessment
 * Evaluates the risk level based on where/who you're buying from
 */

export type SellerType =
    | 'cpo'              // Certified Pre-Owned from manufacturer dealer
    | 'franchise_same'   // Franchise dealer selling same brand (e.g., Honda dealer selling Honda)
    | 'franchise_other'  // Franchise dealer selling different brand
    | 'independent_lot'  // Independent used car lot
    | 'private'          // Private party sale
    | 'auction'          // Auction purchase
    | 'unknown';

export interface SellerRiskResult {
    sellerType: SellerType;
    riskLevel: 'low' | 'medium' | 'high' | 'variable';
    riskScore: number;      // 1-10 (10 = safest)
    advice: string[];       // General buying advice for this seller type
    protections: string[];  // What buyer protections you get
    warnings: string[];     // What to watch for
    negotiationTips: string[];
}

interface SellerProfile {
    riskLevel: SellerRiskResult['riskLevel'];
    riskScore: number;
    protections: string[];
    warnings: string[];
    advice: string[];
    negotiationTips: string[];
}

const SELLER_PROFILES: Record<SellerType, SellerProfile> = {
    cpo: {
        riskLevel: 'low',
        riskScore: 9,
        protections: [
            'Manufacturer-backed warranty (typically 12mo/12k miles additional)',
            'Multi-point inspection required',
            'Vehicle must meet age/mileage requirements',
            'Recourse through manufacturer if issues arise',
            'Often includes roadside assistance'
        ],
        warnings: [
            'CPO premium can be $1,500-3,000 above non-CPO price',
            'Verify CPO status with manufacturer, not just dealer claims',
            'Check what\'s actually covered - some CPO warranties have exclusions'
        ],
        advice: [
            'Request the CPO inspection checklist',
            'Confirm warranty details in writing before purchase',
            'CPO vehicles are generally worth the premium for peace of mind'
        ],
        negotiationTips: [
            'CPO pricing is typically firmer but not fixed',
            'Ask for extras instead of price cuts (extended warranty, maintenance)',
            'Compare CPO premiums across multiple dealers'
        ]
    },
    franchise_same: {
        riskLevel: 'low',
        riskScore: 8,
        protections: [
            'Dealer has brand expertise and access to service records',
            'Trade-ins often come with known history',
            'State lemon laws and dealer regulations apply',
            'Better access to OEM parts if issues arise'
        ],
        warnings: [
            'Not all trade-ins are cherries - some have problems',
            'Dealer may push financing with unfavorable terms',
            'Watch for add-on fees (dealer prep, reconditioning)'
        ],
        advice: [
            'Ask if the vehicle was a local trade-in vs auction purchase',
            'Request service history from their system',
            'Still get independent inspection - brand loyalty doesn\'t guarantee quality'
        ],
        negotiationTips: [
            'More room to negotiate than CPO',
            'End of month/quarter gives more leverage',
            'Financing through dealer gives them profit - use as negotiation chip'
        ]
    },
    franchise_other: {
        riskLevel: 'medium',
        riskScore: 7,
        protections: [
            'State lemon laws and dealer regulations apply',
            'Dealer reputation at stake',
            'May offer limited warranty'
        ],
        warnings: [
            'Dealer may lack expertise on the brand they\'re selling',
            'Vehicle likely came from auction (less known history)',
            'Less incentive to take the car back if problems arise'
        ],
        advice: [
            'Ask why a Toyota dealer is selling a Honda (trade-in vs auction)',
            'Definitely get an independent inspection',
            'Research the specific vehicle thoroughly - dealer may not know its quirks'
        ],
        negotiationTips: [
            'These vehicles often sit longer - use time on lot as leverage',
            'Dealer wants these off the lot - more motivated seller',
            'Cross-brand trades often priced to move quickly'
        ]
    },
    independent_lot: {
        riskLevel: 'medium',
        riskScore: 5,
        protections: [
            'State lemon laws may apply (varies by state)',
            'Better Business Bureau complaints can help',
            'Some offer limited warranties'
        ],
        warnings: [
            'Higher likelihood of auction vehicles',
            'Less regulatory oversight than franchise dealers',
            'Buy Here Pay Here lots often have inflated prices',
            'Mechanical issues may be hidden or minimized',
            '"As-Is" sales are common'
        ],
        advice: [
            'Research the dealer\'s reputation thoroughly (Google, Yelp, BBB)',
            'Pre-purchase inspection is absolutely essential',
            'Get everything in writing',
            'Verify the Carfax/AutoCheck yourself'
        ],
        negotiationTips: [
            'Significant negotiation room at most independent lots',
            'Cash buyers have leverage',
            'Don\'t be afraid to walk away - many similar lots exist'
        ]
    },
    private: {
        riskLevel: 'variable',
        riskScore: 4,
        protections: [
            'Often lowest prices (no dealer markup)',
            'May get more honest answers about vehicle condition',
            'Can see where/how car was kept'
        ],
        warnings: [
            'Usually sold "as-is" with no recourse',
            'Scams are more common (fake sellers, title washing)',
            'No warranty unless transferable from original',
            'Title issues (liens, salvage) more likely to be hidden',
            'Curbstoners pose as private sellers but are unlicensed dealers'
        ],
        advice: [
            'Meet at seller\'s home to verify they own the car',
            'Check that the seller\'s ID matches the title',
            'Use a title check service and run your own Carfax',
            'Pre-purchase inspection is mandatory',
            'Pay with cashier\'s check, not cash'
        ],
        negotiationTips: [
            'Most negotiation room of any seller type',
            'Every flaw you find is a negotiation point',
            'Private sellers often have a "walk-away" price below asking',
            'Timing matters - end of month, seller relocating = leverage'
        ]
    },
    auction: {
        riskLevel: 'high',
        riskScore: 3,
        protections: [
            'Can get very low prices',
            'Arbitration may be available for major issues (varies)'
        ],
        warnings: [
            'Absolutely no warranty',
            'Limited or no test drive opportunity',
            'Vehicles may have hidden problems',
            'Auction fees add to final price',
            'Competition can drive prices above retail',
            'Many auction vehicles are dealer rejects'
        ],
        advice: [
            'Only for experienced buyers who know what to look for',
            'Inspect carefully in the limited time available',
            'Set a max price and stick to it',
            'Factor in fees and potential repairs'
        ],
        negotiationTips: [
            'No negotiation - auction price is final',
            'Know market value before bidding',
            'Don\'t get caught up in bidding wars'
        ]
    },
    unknown: {
        riskLevel: 'variable',
        riskScore: 5,
        protections: [
            'Depends on seller type - ask for clarification'
        ],
        warnings: [
            'Unclear seller type may indicate attempts to hide dealer status',
            'Curbstoners often hide their identity'
        ],
        advice: [
            'Determine if seller is private party or dealer before proceeding',
            'Ask directly and verify claims',
            'If seller is evasive about their status, proceed with extra caution'
        ],
        negotiationTips: [
            'Determine seller type first to know negotiation approach'
        ]
    }
};

/**
 * Attempts to detect seller type from listing text
 */
export function detectSellerType(listingText: string): SellerType {
    const text = listingText.toLowerCase();

    // CPO indicators
    if (/certified\s*pre[\s-]*owned|cpo\b/i.test(text)) {
        return 'cpo';
    }

    // Franchise dealer indicators
    if (/dealership|dealer\b|motors\b|auto\s*group|automotive|auto\s*mall/i.test(text)) {
        // Could be franchise or independent - default to independent unless brand-specific
        if (/authorized|franchise|official/i.test(text)) {
            return 'franchise_same'; // Assume same brand if they mention authorized
        }
        return 'independent_lot';
    }

    // Auction indicators
    if (/auction|salvage\s*auction|copart|iaai|manheim/i.test(text)) {
        return 'auction';
    }

    // Private party indicators
    if (/private\s*(party|seller|sale)|owner\s*selling|i'?m\s*selling|my\s*(car|vehicle)|first\s*owner/i.test(text)) {
        return 'private';
    }

    // Default to unknown
    return 'unknown';
}

/**
 * Assesses seller risk based on seller type
 */
export function assessSellerRisk(
    sellerType: SellerType,
    listingText?: string
): SellerRiskResult {
    // If unknown and listing text provided, try to detect
    let effectiveType = sellerType;
    if (sellerType === 'unknown' && listingText) {
        effectiveType = detectSellerType(listingText);
    }

    const profile = SELLER_PROFILES[effectiveType];

    return {
        sellerType: effectiveType,
        riskLevel: profile.riskLevel,
        riskScore: profile.riskScore,
        advice: profile.advice,
        protections: profile.protections,
        warnings: profile.warnings,
        negotiationTips: profile.negotiationTips
    };
}

/**
 * Returns a summary description of the seller type
 */
export function getSellerTypeLabel(sellerType: SellerType): string {
    const labels: Record<SellerType, string> = {
        cpo: 'Certified Pre-Owned',
        franchise_same: 'Franchise Dealer (Same Brand)',
        franchise_other: 'Franchise Dealer (Other Brand)',
        independent_lot: 'Independent Dealer',
        private: 'Private Seller',
        auction: 'Auction',
        unknown: 'Unknown Seller Type'
    };
    return labels[sellerType];
}

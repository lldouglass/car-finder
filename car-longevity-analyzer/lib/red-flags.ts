export interface RedFlag {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    advice: string;
    questionToAsk?: string;
    source?: 'listing' | 'ai' | 'history' | 'price';
}

export interface PositiveIndicator {
    type: string;
    message: string;
}

interface Recall {
    Component: string;
    // Add other properties if needed
}

interface VehicleInfo {
    make: string;
    model: string;
    year: number;
}


// --- Pattern Definitions ---

const CRITICAL_PATTERNS = [
    {
        pattern: /salvage\s*title/i,
        message: 'Salvage title - vehicle was totaled',
        advice: 'Do not buy this vehicle unless you are an expert. Financing and insurance will be difficult or impossible.',
        type: 'title_issue'
    },
    {
        pattern: /rebuilt\s*title/i,
        message: 'Rebuilt title - was previously salvaged',
        advice: 'Have a trusted mechanic inspect the repairs thoroughly. Resale value is significantly lower.',
        type: 'title_issue'
    },
    {
        pattern: /flood\s*(damage|car|vehicle)/i,
        message: 'Possible flood damage',
        advice: 'Run away. Flood damage causes electrical gremlins that never go away.',
        type: 'damage_history'
    },
    {
        pattern: /no\s*vin|vin\s*not\s*available/i,
        message: 'VIN not provided',
        advice: 'Ask for the VIN immediately. If refused, walk away.',
        type: 'missing_info'
    },
    {
        pattern: /selling\s*for\s*(a\s*)?(friend|someone|family)/i,
        message: 'Third-party sale',
        advice: 'Verify the seller has the legal right to sell the car. Title jumping is illegal.',
        type: 'ownership_issue',
        questionToAsk: 'Is your name on the title?'
    },
];

const HIGH_PATTERNS = [
    {
        pattern: /cash\s*only.*no\s*test/i,
        message: 'Cash only / No test drives',
        advice: 'Never buy a car without driving it. This is a major red flag.',
        type: 'seller_behavior'
    },
    {
        pattern: /parts\s*(car|only|vehicle)/i,
        message: 'Listed as parts car',
        advice: 'This car is not roadworthy in its current state.',
        type: 'vehicle_condition'
    },
    {
        pattern: /does\s*n[o']t\s*(run|start|drive)/i,
        message: 'Vehicle does not run',
        advice: 'Only consider if you are looking for a project and can tow it.',
        type: 'mechanical_issue',
        questionToAsk: 'What specifically prevents it from running?'
    },
    {
        pattern: /needs?\s*(major|engine|transmission)\s*(work|repair)/i,
        message: 'Needs major repairs',
        advice: 'Get a repair estimate before negotiating. Costs often exceed value.',
        type: 'mechanical_issue',
        questionToAsk: 'Have you had a mechanic diagnose the issue?'
    },
];

const MEDIUM_PATTERNS = [
    {
        pattern: /as[\s-]*is/i,
        message: 'Sold as-is',
        advice: 'Standard for used cars, but means no recourse after buying. Inspect carefully.',
        type: 'sale_terms'
    },
    {
        pattern: /mechanic'?s?\s*special/i,
        message: "Mechanic's special",
        advice: 'Expect to spend money on repairs.',
        type: 'vehicle_condition'
    },
    {
        pattern: /must\s*sell\s*(today|fast|quick|asap)/i,
        message: 'Pressure to sell',
        advice: 'Don\'t let urgency stop you from doing due diligence.',
        type: 'seller_behavior'
    },
    {
        pattern: /minor\s*(accident|damage|fender)/i,
        message: 'Mentions accident',
        advice: 'Check for frame damage and quality of repairs.',
        type: 'damage_history',
        questionToAsk: 'Do you have photos of the damage before it was fixed?'
    },
    {
        pattern: /check\s*engine\s*light/i,
        message: 'Check engine light on',
        advice: 'Scan the codes yourself. It could be simple or catastrophic.',
        type: 'mechanical_issue',
        questionToAsk: 'What code is the check engine light throwing?'
    },
];

const LOW_PATTERNS = [
    {
        pattern: /high(er)?\s*mile(age|s)?/i,
        message: 'High mileage acknowledged',
        advice: 'Check maintenance records closely.',
        type: 'usage'
    },
    {
        pattern: /no\s*(low\s*)?ball(ers)?/i,
        message: 'Firm on price',
        advice: 'Seller may be difficult to negotiate with.',
        type: 'negotiation'
    },
    {
        pattern: /text\s*only/i,
        message: 'Text communication only',
        advice: 'Proceed with normal caution.',
        type: 'communication'
    },
];

const POSITIVE_PATTERNS = [
    { pattern: /one\s*owner/i, message: 'Single owner vehicle' },
    { pattern: /maintenance\s*records?/i, message: 'Maintenance records available' },
    { pattern: /garage\s*kept/i, message: 'Garage kept' },
    { pattern: /no\s*(accidents?|damage)/i, message: 'No accidents reported' },
    { pattern: /new(ly)?\s*(replaced|installed).*(timing|brakes|tires)/i, message: 'Recent maintenance completed' },
    { pattern: /carfax\s*(available|clean|provided)/i, message: 'Carfax available' },
];

/**
 * Scans listing text for red flags.
 */
export function detectRedFlags(listingText: string): RedFlag[] {
    if (!listingText) return [];

    const flags: RedFlag[] = [];

    // Helper to check and push
    const check = (patterns: typeof CRITICAL_PATTERNS, severity: RedFlag['severity']) => {
        patterns.forEach(p => {
            if (p.pattern.test(listingText)) {
                flags.push({
                    type: p.type,
                    severity,
                    message: p.message,
                    advice: p.advice,
                    questionToAsk: p.questionToAsk
                });
            }
        });
    };

    check(CRITICAL_PATTERNS, 'critical');
    check(HIGH_PATTERNS, 'high');
    check(MEDIUM_PATTERNS, 'medium');
    check(LOW_PATTERNS, 'low');

    return flags;
}

/**
 * Detects pricing anomalies.
 */
export function detectPriceAnomaly(
    askingPrice: number,
    fairPriceLow: number,
    fairPriceHigh: number
): RedFlag | null {
    const percentBelowLow = ((fairPriceLow - askingPrice) / fairPriceLow) * 100;

    if (percentBelowLow > 30) {
        return {
            type: 'price_anomaly',
            severity: 'high',
            message: `Price is ${Math.round(percentBelowLow)}% below market - potential scam.`,
            advice: 'Be very cautious. If it seems too good to be true, it probably is. Verify title and existence.',
            questionToAsk: 'Why is the price so much lower than market value?'
        };
    }

    if (percentBelowLow > 15) {
        return {
            type: 'price_anomaly',
            severity: 'medium',
            message: 'Price is significantly below market.',
            advice: 'Ask why the price is low. Check for hidden issues.',
            questionToAsk: 'Why are you selling below market value?'
        };
    }

    return null;
}

/**
 * Scans for positive sentiment/indicators.
 */
export function detectPositiveIndicators(listingText: string): PositiveIndicator[] {
    if (!listingText) return [];

    const indicators: PositiveIndicator[] = [];

    POSITIVE_PATTERNS.forEach(p => {
        if (p.pattern.test(listingText)) {
            indicators.push({
                type: 'positive',
                message: p.message
            });
        }
    });

    return indicators;
}

/**
 * Creates red flags from vehicle history data (NMVTIS/VinAudit).
 */
export function createHistoryRedFlags(historyAnalysis: {
    hasCriticalIssue: boolean;
    hasHighRiskIssue: boolean;
    issues: Array<{ type: string; severity: 'critical' | 'high' | 'medium'; description: string }>;
}): RedFlag[] {
    const flags: RedFlag[] = [];

    for (const issue of historyAnalysis.issues) {
        let advice = '';
        let questionToAsk = '';

        switch (issue.type) {
            case 'title_brand':
                if (issue.severity === 'critical') {
                    advice = 'Salvage/rebuilt/flood titles significantly impact value and may cause insurance/financing issues. Only buy if you are an expert.';
                    questionToAsk = 'Can you provide documentation of the repairs that were made?';
                } else {
                    advice = 'This title brand may affect resale value and insurability.';
                    questionToAsk = 'What was the reason for this title brand?';
                }
                break;
            case 'odometer':
                advice = 'Odometer discrepancy is a serious red flag. The mileage may have been tampered with.';
                questionToAsk = 'Can you explain the odometer reading history?';
                break;
            case 'theft':
                advice = 'A theft record requires careful verification of ownership and title.';
                questionToAsk = 'Can you provide proof that the theft was resolved and you have clear title?';
                break;
            case 'total_loss':
                advice = 'A total loss declaration means an insurance company determined the vehicle was not worth repairing.';
                questionToAsk = 'What damage caused the total loss and what repairs were made?';
                break;
            default:
                advice = 'Review this issue carefully before purchasing.';
        }

        flags.push({
            type: `history_${issue.type}`,
            severity: issue.severity,
            message: issue.description,
            advice,
            questionToAsk,
            source: 'history'
        });
    }

    return flags;
}

/**
 * Generates specific questions for the seller.
 */
export function generateQuestionsForSeller(
    vehicle: VehicleInfo,
    redFlags: RedFlag[],
    recalls: Recall[]
): string[] {
    const questions: string[] = [];

    // 1. General essential questions
    questions.push('Do you have maintenance records I can review?');
    questions.push('Has the vehicle been in any accidents?');
    questions.push('Why are you selling?');

    // 2. Recall questions
    if (recalls.length > 0) {
        // Only ask about the first/most recent one to avoid overwhelming, or generalize
        questions.push(`Has the open recall regarding ${recalls[0].Component.toLowerCase()} been addressed?`);
    }

    // 3. Red flag specific questions
    redFlags.forEach(flag => {
        if (flag.questionToAsk) {
            questions.push(flag.questionToAsk);
        }
    });

    // Uniquify
    const uniqueQuestions = Array.from(new Set(questions));

    // Limit to reasonable number
    return uniqueQuestions.slice(0, 8);
}

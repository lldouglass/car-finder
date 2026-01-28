/**
 * Negotiation Talking Points Generator
 * Generates strategic negotiation advice based on vehicle analysis
 */

import type { KnownIssue } from './reliability-data';
import type { RedFlag } from './red-flags';
import { VEHICLE_CONSTANTS } from './constants';

export interface NegotiationPoint {
    category: 'price' | 'condition' | 'market' | 'issues' | 'history' | 'timing';
    point: string;
    leverage: 'strong' | 'moderate' | 'weak';
    suggestedReduction: number;
    script?: string;
}

export interface NegotiationStrategy {
    overallLeverage: 'strong' | 'moderate' | 'weak' | 'none';
    suggestedOffer: number;
    walkAwayPrice: number;
    points: NegotiationPoint[];
    openingStatement: string;
}

/**
 * Calculate expected mileage for vehicle age
 */
function getExpectedMileage(year: number): number {
    const currentYear = new Date().getFullYear();
    const age = Math.max(1, currentYear - year);
    return age * VEHICLE_CONSTANTS.avgMilesPerYear;
}

/**
 * Generate negotiation points based on price analysis
 */
function generatePricePoints(
    askingPrice: number,
    fairPriceLow: number,
    fairPriceHigh: number
): NegotiationPoint[] {
    const points: NegotiationPoint[] = [];
    const fairMid = (fairPriceLow + fairPriceHigh) / 2;

    if (askingPrice > fairPriceHigh) {
        const overpricedBy = askingPrice - fairPriceHigh;
        const percentOver = ((askingPrice - fairPriceHigh) / fairPriceHigh) * 100;

        points.push({
            category: 'price',
            point: `Price is ${Math.round(percentOver)}% above fair market value`,
            leverage: percentOver > 15 ? 'strong' : 'moderate',
            suggestedReduction: overpricedBy,
            script: `I've researched comparable vehicles and they're selling for $${fairMid.toLocaleString()} to $${fairPriceHigh.toLocaleString()}. At $${askingPrice.toLocaleString()}, you're about $${overpricedBy.toLocaleString()} above market.`
        });
    } else if (askingPrice > fairMid) {
        const reduction = askingPrice - fairMid;
        points.push({
            category: 'price',
            point: 'Price is in upper range of fair market value',
            leverage: 'weak',
            suggestedReduction: reduction,
            script: `Your price is on the higher end of what I'm seeing for similar vehicles. I'm comfortable paying closer to $${fairMid.toLocaleString()}.`
        });
    }

    return points;
}

/**
 * Generate negotiation points based on known issues
 */
function generateIssuePoints(
    knownIssues: KnownIssue[],
    currentMileage: number,
    vehicleYear: number
): NegotiationPoint[] {
    const points: NegotiationPoint[] = [];

    for (const issue of knownIssues) {
        // Check if issue affects this year
        if (issue.affectedYears && !issue.affectedYears.includes(vehicleYear)) {
            continue;
        }

        // Check if vehicle is in mileage range for issue
        const { start, end } = issue.mileageRange;
        const inRange = currentMileage >= start && currentMileage <= end;
        const approaching = currentMileage < start && start - currentMileage < 20000;

        if (inRange || approaching) {
            const leverage = issue.severity === 'critical' || issue.severity === 'major'
                ? 'strong'
                : 'moderate';

            const avgRepairCost = (issue.repairCost.low + issue.repairCost.high) / 2;

            points.push({
                category: 'issues',
                point: `Known ${issue.component} issue: ${issue.description.split(' - ')[0]}`,
                leverage,
                suggestedReduction: Math.round(avgRepairCost * (inRange ? 1 : 0.5)),
                script: inRange
                    ? `This model year is known for ${issue.description}. With ${currentMileage.toLocaleString()} miles, this issue could appear anytime. Repairs typically cost $${issue.repairCost.low.toLocaleString()}-$${issue.repairCost.high.toLocaleString()}.`
                    : `This model year is known for ${issue.description} around ${start.toLocaleString()}-${end.toLocaleString()} miles. That's coming up, so I need to factor in potential repair costs.`
            });
        }
    }

    return points;
}

/**
 * Generate negotiation points based on red flags
 */
function generateRedFlagPoints(redFlags: RedFlag[]): NegotiationPoint[] {
    const points: NegotiationPoint[] = [];

    // Only use medium/low severity flags as negotiation points
    // Critical/high flags should be deal-breakers, not negotiation chips
    const negotiableFlags = redFlags.filter(f =>
        f.severity.toLowerCase() === 'medium' || f.severity.toLowerCase() === 'low'
    );

    for (const flag of negotiableFlags.slice(0, 3)) {
        const leverage = flag.severity === 'medium' ? 'moderate' : 'weak';
        const reduction = flag.severity === 'medium' ? 500 : 200;

        points.push({
            category: 'condition',
            point: flag.message,
            leverage,
            suggestedReduction: reduction,
            script: flag.advice
        });
    }

    return points;
}

/**
 * Generate negotiation points based on mileage
 */
function generateMileagePoints(
    currentMileage: number,
    vehicleYear: number
): NegotiationPoint[] {
    const points: NegotiationPoint[] = [];
    const expectedMileage = getExpectedMileage(vehicleYear);
    const mileageDiff = currentMileage - expectedMileage;

    if (mileageDiff > 20000) {
        const percentOver = Math.round((mileageDiff / expectedMileage) * 100);
        // Estimate $0.05-0.10 per mile over average as negotiation value
        const reduction = Math.round(mileageDiff * 0.07);

        points.push({
            category: 'condition',
            point: `${mileageDiff.toLocaleString()} miles above average for age (${percentOver}% higher)`,
            leverage: percentOver > 30 ? 'strong' : 'moderate',
            suggestedReduction: Math.min(reduction, 3000), // Cap at $3000
            script: `For a ${vehicleYear} model, average mileage would be around ${expectedMileage.toLocaleString()} miles. This one has ${currentMileage.toLocaleString()}, which is ${percentOver}% higher than typical. That accelerated wear needs to be reflected in the price.`
        });
    }

    return points;
}

/**
 * Generate general negotiation tactics based on timing
 */
function generateTimingPoints(): NegotiationPoint[] {
    const now = new Date();
    const month = now.getMonth();
    const dayOfWeek = now.getDay();
    const points: NegotiationPoint[] = [];

    // End of month leverage
    if (now.getDate() >= 25) {
        points.push({
            category: 'timing',
            point: 'End of month timing',
            leverage: 'moderate',
            suggestedReduction: 0,
            script: 'Sellers and dealers are often more motivated at month end to meet quotas. Use this to your advantage.'
        });
    }

    // End of quarter
    if ((month === 2 || month === 5 || month === 8 || month === 11) && now.getDate() >= 20) {
        points.push({
            category: 'timing',
            point: 'End of quarter timing',
            leverage: 'moderate',
            suggestedReduction: 0,
            script: 'Quarter-end pressure can make dealers more flexible on pricing.'
        });
    }

    // Weekday advantage
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        points.push({
            category: 'timing',
            point: 'Weekday negotiation',
            leverage: 'weak',
            suggestedReduction: 0,
            script: 'Dealers are typically less busy on weekdays and may be more willing to negotiate.'
        });
    }

    return points;
}

/**
 * Generate opening statement for negotiation
 */
function generateOpeningStatement(
    askingPrice: number,
    suggestedOffer: number,
    strongestPoint: NegotiationPoint | undefined
): string {
    const discountPercent = Math.round(((askingPrice - suggestedOffer) / askingPrice) * 100);

    if (!strongestPoint) {
        return `I'm interested in the vehicle, but I'd like to discuss the price. Based on my research, I'm prepared to offer $${suggestedOffer.toLocaleString()}.`;
    }

    const reasonIntro = strongestPoint.category === 'price'
        ? 'After researching comparable vehicles'
        : strongestPoint.category === 'issues'
            ? 'Given the known issues with this model year'
            : 'Considering the vehicle\'s condition';

    return `${reasonIntro}, I'd like to make an offer of $${suggestedOffer.toLocaleString()}. ${strongestPoint.script || ''}`;
}

/**
 * Generate closing tactics
 */
function generateClosingTactics(leverage: 'strong' | 'moderate' | 'weak' | 'none'): string[] {
    const tactics: string[] = [];

    if (leverage === 'strong' || leverage === 'moderate') {
        tactics.push('Be prepared to walk away - this is your strongest negotiating tool');
        tactics.push('If seller won\'t budge on price, ask for extras: new tires, maintenance, extended warranty');
        tactics.push('Get any agreed price or terms in writing before leaving');
    }

    if (leverage === 'weak' || leverage === 'none') {
        tactics.push('Focus on building rapport rather than aggressive negotiation');
        tactics.push('Ask about their timeline - sellers in a hurry may be more flexible');
        tactics.push('Consider offering quick, easy transaction in exchange for modest discount');
    }

    tactics.push('Never reveal your maximum budget');
    tactics.push('Use silence as a tool - let the seller fill awkward pauses');
    tactics.push('If financing, negotiate price before discussing payment terms');

    return tactics;
}

/**
 * Generate warnings for the buyer
 */
function generateWarnings(redFlags: RedFlag[]): string[] {
    const warnings: string[] = [];

    // Check for critical/high severity red flags
    const seriousFlags = redFlags.filter(f =>
        f.severity.toLowerCase() === 'critical' || f.severity.toLowerCase() === 'high'
    );

    if (seriousFlags.length > 0) {
        warnings.push('Serious red flags detected - consider whether negotiating is worth your time');
    }

    warnings.push('Always get a pre-purchase inspection regardless of price negotiated');
    warnings.push('Don\'t let emotions override logic - be willing to walk away');
    warnings.push('Verify everything the seller claims with documentation');

    return warnings;
}

/**
 * Main function to generate complete negotiation strategy
 */
export function generateNegotiationStrategy(
    askingPrice: number,
    fairPriceLow: number,
    fairPriceHigh: number,
    knownIssues: KnownIssue[] = [],
    redFlags: RedFlag[] = [],
    mileage: number,
    year: number
): NegotiationStrategy {
    const fairMid = (fairPriceLow + fairPriceHigh) / 2;

    // Check if asking price is already a good deal
    const isGoodDeal = askingPrice <= fairPriceLow;
    const isFairDeal = askingPrice <= fairMid;

    // Generate vehicle-specific negotiation points only
    const allPoints: NegotiationPoint[] = [
        ...generatePricePoints(askingPrice, fairPriceLow, fairPriceHigh),
        ...generateIssuePoints(knownIssues, mileage, year),
        ...generateRedFlagPoints(redFlags),
        ...generateMileagePoints(mileage, year)
    ];

    // Sort by leverage (strong first)
    const leverageOrder = { strong: 0, moderate: 1, weak: 2 };
    allPoints.sort((a, b) => leverageOrder[a.leverage] - leverageOrder[b.leverage]);

    // Calculate total suggested reduction
    const totalReduction = allPoints.reduce((sum, p) => sum + p.suggestedReduction, 0);

    let suggestedOffer: number;
    let walkAwayPrice: number;
    let overallLeverage: 'strong' | 'moderate' | 'weak' | 'none';
    let openingStatement: string;

    if (isGoodDeal) {
        // Price is already below fair value - don't suggest MORE than asking
        suggestedOffer = askingPrice;
        walkAwayPrice = Math.round(askingPrice * 1.05); // Walk away if they raise price
        overallLeverage = 'none';
        openingStatement = `This is already priced below market value at $${askingPrice.toLocaleString()}. Consider making a quick, clean offer at asking price to secure the deal before someone else does.`;
    } else if (isFairDeal) {
        // Price is fair but not a steal - modest negotiation
        suggestedOffer = Math.max(askingPrice * 0.95, fairPriceLow);
        walkAwayPrice = Math.round(askingPrice * 1.02);
        overallLeverage = 'weak';
        openingStatement = `The price is fair. You might get a small discount by offering $${Math.round(suggestedOffer).toLocaleString()}, but don't push too hard or you may lose the deal.`;
    } else {
        // Price is above fair value - normal negotiation
        suggestedOffer = Math.max(
            fairPriceLow * 0.95, // Floor at 95% of fair low
            askingPrice - totalReduction
        );
        // Cap suggested offer at asking price (never suggest more)
        suggestedOffer = Math.min(suggestedOffer, askingPrice);

        walkAwayPrice = Math.round(suggestedOffer + (askingPrice - suggestedOffer) * 0.3);

        // Determine overall leverage
        const strongPoints = allPoints.filter(p => p.leverage === 'strong').length;
        const moderatePoints = allPoints.filter(p => p.leverage === 'moderate').length;

        if (strongPoints >= 2 || (strongPoints === 1 && moderatePoints >= 2)) {
            overallLeverage = 'strong';
        } else if (strongPoints === 1 || moderatePoints >= 2) {
            overallLeverage = 'moderate';
        } else if (moderatePoints === 1 || allPoints.length > 0) {
            overallLeverage = 'weak';
        } else {
            overallLeverage = 'none';
        }

        // Generate opening statement
        const strongestPoint = allPoints.find(p => p.leverage === 'strong') || allPoints[0];
        openingStatement = generateOpeningStatement(askingPrice, suggestedOffer, strongestPoint);
    }

    return {
        overallLeverage,
        suggestedOffer: Math.round(suggestedOffer),
        walkAwayPrice: Math.round(walkAwayPrice),
        points: isGoodDeal ? [] : allPoints.slice(0, 6), // No points needed for good deals
        openingStatement
    };
}

/**
 * Get leverage description for display
 */
export function getLeverageDescription(leverage: 'strong' | 'moderate' | 'weak' | 'none'): string {
    const descriptions = {
        strong: 'You have significant negotiating power. Use it.',
        moderate: 'You have some room to negotiate. Be firm but reasonable.',
        weak: 'Limited leverage. Focus on rapport and flexibility.',
        none: 'Fair price. Negotiate on extras rather than price.'
    };
    return descriptions[leverage];
}

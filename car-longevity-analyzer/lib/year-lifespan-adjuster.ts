import OpenAI from 'openai';
import { getReliabilityData } from './reliability-data';
import { KNOWN_ISSUE_MULTIPLIERS } from './lifespan-factors';
import {
    LIFESPAN_ADJUSTMENT_LIMITS,
    VEHICLE_CONSTANTS,
    YEAR_LIFESPAN_ADJUSTMENTS,
} from './constants';

// === Types ===

export interface LifespanAdjustment {
    reason: string;
    impact: 'positive' | 'negative' | 'neutral';
    multiplier: number;
}

export interface YearSpecificLifespan {
    expectedLifespanMiles: number;
    expectedLifespanYears: number;
    baseLifespanMiles: number;
    yearMultiplier: number;
    adjustments: LifespanAdjustment[];
    confidence: 'high' | 'medium' | 'low';
    source: 'database' | 'ai' | 'default';
    inDatabase: boolean;
}

// === OpenAI client (reuse lazy pattern from ai-analyzer.ts) ===

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
    if (openaiClient) return openaiClient;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    openaiClient = new OpenAI({ apiKey });
    return openaiClient;
}

// === In-memory cache for AI estimates ===

interface CacheEntry {
    result: YearSpecificLifespan;
    timestamp: number;
}

const lifespanCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;

function getCacheKey(make: string, model: string, year: number): string {
    return `${make.toLowerCase()}|${model.toLowerCase()}|${year}`;
}

function getCached(key: string): YearSpecificLifespan | null {
    const entry = lifespanCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        lifespanCache.delete(key);
        return null;
    }
    return entry.result;
}

function setCache(key: string, result: YearSpecificLifespan): void {
    // Evict oldest entries if at capacity
    if (lifespanCache.size >= MAX_CACHE_SIZE) {
        const firstKey = lifespanCache.keys().next().value;
        if (firstKey !== undefined) {
            lifespanCache.delete(firstKey);
        }
    }
    lifespanCache.set(key, { result, timestamp: Date.now() });
}

// Exported for testing
export function clearCache(): void {
    lifespanCache.clear();
}

// === Core calculation ===

/**
 * Calculates year-specific expected lifespan for a vehicle.
 * Uses local reliability DB when available, falls back to AI for unknown vehicles.
 */
export async function calculateYearSpecificLifespan(
    make: string,
    model: string,
    year: number
): Promise<YearSpecificLifespan> {
    const cacheKey = getCacheKey(make, model, year);
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const relData = getReliabilityData(make, model);

    let result: YearSpecificLifespan;
    if (relData) {
        result = calculateFromDatabase(relData.expectedLifespanMiles, relData.yearsToAvoid, relData.knownIssues || [], make, model, year);
    } else {
        result = await estimateWithAIFallback(make, model, year);
    }

    setCache(cacheKey, result);
    return result;
}

interface KnownIssueInput {
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    description: string;
    affectedYears?: number[];
}

function calculateFromDatabase(
    baseLifespanMiles: number,
    yearsToAvoid: number[],
    knownIssues: KnownIssueInput[],
    make: string,
    model: string,
    year: number
): YearSpecificLifespan {
    const adjustments: LifespanAdjustment[] = [];
    let combinedMultiplier = 1.0;

    // Layer A: Year-to-avoid penalty
    if (yearsToAvoid.includes(year)) {
        const penalty = YEAR_LIFESPAN_ADJUSTMENTS.yearToAvoidPenalty;
        combinedMultiplier *= penalty;
        adjustments.push({
            reason: `${year} is a known problematic year for the ${make} ${model}`,
            impact: 'negative',
            multiplier: penalty,
        });
    }

    // Layer B: Known issue penalty (worst matching issue only)
    const matchingIssues = knownIssues.filter(
        issue => issue.affectedYears && issue.affectedYears.includes(year)
    );

    if (matchingIssues.length > 0) {
        // Find worst severity
        let worstMultiplier = 1.0;
        let worstIssue: KnownIssueInput | null = null;

        for (const issue of matchingIssues) {
            const mult = KNOWN_ISSUE_MULTIPLIERS[issue.severity] ?? 1.0;
            if (mult < worstMultiplier) {
                worstMultiplier = mult;
                worstIssue = issue;
            }
        }

        if (worstMultiplier < 1.0 && worstIssue) {
            combinedMultiplier *= worstMultiplier;
            // Truncate long descriptions
            const desc = worstIssue.description.length > 80
                ? worstIssue.description.slice(0, 77) + '...'
                : worstIssue.description;
            adjustments.push({
                reason: desc,
                impact: 'negative',
                multiplier: worstMultiplier,
            });
        }
    }

    // Layer C: Model year era bonus/penalty
    if (year >= 2020) {
        const bonus = YEAR_LIFESPAN_ADJUSTMENTS.modernEraBonus2020;
        combinedMultiplier *= bonus;
        adjustments.push({
            reason: 'Modern manufacturing and engineering standards',
            impact: 'positive',
            multiplier: bonus,
        });
    } else if (year >= 2015) {
        const bonus = YEAR_LIFESPAN_ADJUSTMENTS.modernEraBonus2015;
        combinedMultiplier *= bonus;
        adjustments.push({
            reason: 'Recent manufacturing standards',
            impact: 'positive',
            multiplier: bonus,
        });
    } else if (year < 2005) {
        const penalty = YEAR_LIFESPAN_ADJUSTMENTS.oldEraPenalty;
        combinedMultiplier *= penalty;
        adjustments.push({
            reason: 'Older engineering and safety standards',
            impact: 'negative',
            multiplier: penalty,
        });
    }

    // Clamp multiplier
    combinedMultiplier = Math.max(
        LIFESPAN_ADJUSTMENT_LIMITS.minMultiplier,
        Math.min(LIFESPAN_ADJUSTMENT_LIMITS.maxMultiplier, combinedMultiplier)
    );

    const adjustedMiles = Math.round(baseLifespanMiles * combinedMultiplier);
    const hasYearSpecificData = matchingIssues.length > 0 || yearsToAvoid.includes(year);

    return {
        expectedLifespanMiles: adjustedMiles,
        expectedLifespanYears: Math.round(adjustedMiles / VEHICLE_CONSTANTS.avgMilesPerYear),
        baseLifespanMiles: baseLifespanMiles,
        yearMultiplier: Math.round(combinedMultiplier * 1000) / 1000,
        adjustments,
        confidence: hasYearSpecificData ? 'high' : 'medium',
        source: 'database',
        inDatabase: true,
    };
}

// === AI Fallback ===

interface AILifespanResponse {
    expectedLifespanMiles: number;
    confidence: 'medium' | 'low';
    reasoning: string;
}

async function estimateWithAIFallback(
    make: string,
    model: string,
    year: number
): Promise<YearSpecificLifespan> {
    const client = getOpenAIClient();
    if (!client) {
        return buildDefaultEstimate(make, model, year);
    }

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0,
            max_completion_tokens: 200,
            messages: [
                {
                    role: 'system',
                    content: 'You are a vehicle reliability expert. Return ONLY valid JSON, no markdown or extra text.',
                },
                {
                    role: 'user',
                    content: `Estimate the expected lifespan in miles for a ${year} ${make} ${model}.

Consider:
- The vehicle's overall reliability reputation
- Common issues for this specific model year
- Engine/transmission durability for this generation
- Average miles driven per year: 12,000

Return ONLY a JSON object:
{"expectedLifespanMiles": number (between 80000 and 300000), "confidence": "medium" or "low", "reasoning": "One sentence explanation"}`,
                },
            ],
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            return buildDefaultEstimate(make, model, year);
        }

        const parsed: AILifespanResponse = JSON.parse(content);

        // Validate and clamp
        let miles = parsed.expectedLifespanMiles;
        if (typeof miles !== 'number' || !Number.isFinite(miles)) {
            return buildDefaultEstimate(make, model, year);
        }
        miles = Math.max(80000, Math.min(300000, Math.round(miles)));

        const confidence = parsed.confidence === 'medium' ? 'medium' : 'low';

        return {
            expectedLifespanMiles: miles,
            expectedLifespanYears: Math.round(miles / VEHICLE_CONSTANTS.avgMilesPerYear),
            baseLifespanMiles: miles,
            yearMultiplier: 1.0,
            adjustments: parsed.reasoning ? [{
                reason: parsed.reasoning,
                impact: 'neutral' as const,
                multiplier: 1.0,
            }] : [],
            confidence,
            source: 'ai',
            inDatabase: false,
        };
    } catch (error) {
        console.warn('AI lifespan estimation failed:', error instanceof Error ? error.message : error);
        return buildDefaultEstimate(make, model, year);
    }
}

function buildDefaultEstimate(make: string, model: string, year: number): YearSpecificLifespan {
    const defaultMiles = LIFESPAN_ADJUSTMENT_LIMITS.defaultLifespan;
    return {
        expectedLifespanMiles: defaultMiles,
        expectedLifespanYears: Math.round(defaultMiles / VEHICLE_CONSTANTS.avgMilesPerYear),
        baseLifespanMiles: defaultMiles,
        yearMultiplier: 1.0,
        adjustments: [],
        confidence: 'low',
        source: 'default',
        inDatabase: false,
    };
}

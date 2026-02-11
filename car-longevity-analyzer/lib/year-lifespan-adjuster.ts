import OpenAI from 'openai';
import { getReliabilityData } from './reliability-data';
import { KNOWN_ISSUE_MULTIPLIERS } from './lifespan-factors';
import { prisma } from './db';
import type { Complaint } from './nhtsa';
import {
    LIFESPAN_ADJUSTMENT_LIMITS,
    VEHICLE_CONSTANTS,
    YEAR_LIFESPAN_ADJUSTMENTS,
    AI_LIFESPAN_PROMPT_VERSION,
    AI_LIFESPAN_STALENESS,
    AI_HYBRID_BOUNDS,
    AI_STANDALONE_BOUNDS,
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
    reasoning?: string;
    comparableVehicle?: string;
    /** Granular source detail: 'ai_hybrid' | 'ai_standalone' | 'database' | 'default' */
    sourceDetail?: string;
}

interface KnownIssueInput {
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    description: string;
    affectedYears?: number[];
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

// === In-memory cache (L1 — fast, volatile) ===

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

// === PostgreSQL persistence (L2 — durable) ===

interface PersistedEstimate {
    expectedLifespanMiles: number;
    confidence: string;
    source: string;
    reasoning: string;
    complaintCount: number;
    modelVersion: string;
    updatedAt: Date;
}

export async function getPersistedEstimate(make: string, model: string, year: number): Promise<PersistedEstimate | null> {
    try {
        return await prisma.lifespanEstimate.findUnique({
            where: {
                make_model_year: {
                    make: make.toLowerCase(),
                    model: model.toLowerCase(),
                    year,
                },
            },
        });
    } catch (error) {
        console.warn('Failed to read persisted lifespan estimate:', error instanceof Error ? error.message : error);
        return null;
    }
}

export async function persistEstimate(
    make: string,
    model: string,
    year: number,
    result: YearSpecificLifespan,
    complaintCount: number
): Promise<void> {
    try {
        await prisma.lifespanEstimate.upsert({
            where: {
                make_model_year: {
                    make: make.toLowerCase(),
                    model: model.toLowerCase(),
                    year,
                },
            },
            create: {
                make: make.toLowerCase(),
                model: model.toLowerCase(),
                year,
                expectedLifespanMiles: result.expectedLifespanMiles,
                confidence: result.confidence,
                source: result.sourceDetail || result.source,
                reasoning: result.reasoning || '',
                complaintCount,
                modelVersion: AI_LIFESPAN_PROMPT_VERSION,
            },
            update: {
                expectedLifespanMiles: result.expectedLifespanMiles,
                confidence: result.confidence,
                source: result.sourceDetail || result.source,
                reasoning: result.reasoning || '',
                complaintCount,
                modelVersion: AI_LIFESPAN_PROMPT_VERSION,
            },
        });
    } catch (error) {
        console.warn('Failed to persist lifespan estimate:', error instanceof Error ? error.message : error);
    }
}

export function isEstimateStale(estimate: PersistedEstimate, currentComplaintCount: number): boolean {
    // Prompt version mismatch — re-estimate with new prompt
    if (estimate.modelVersion !== AI_LIFESPAN_PROMPT_VERSION) return true;

    // If we had no complaints before but now have significant ones
    if (estimate.complaintCount === 0 && currentComplaintCount > AI_LIFESPAN_STALENESS.complaintThresholdNew) return true;

    // If complaints have significantly increased
    if (currentComplaintCount > estimate.complaintCount + AI_LIFESPAN_STALENESS.complaintThresholdDelta) return true;

    // If estimate is older than max age
    const maxAgeMs = AI_LIFESPAN_STALENESS.maxAgeDays * 24 * 60 * 60 * 1000;
    if (Date.now() - estimate.updatedAt.getTime() > maxAgeMs) return true;

    return false;
}

function buildResultFromPersisted(estimate: PersistedEstimate, inDatabase: boolean): YearSpecificLifespan {
    const confidence = estimate.confidence as 'high' | 'medium' | 'low';
    const sourceDetail = estimate.source;
    // Map granular source to backward-compatible source
    const source: 'database' | 'ai' | 'default' =
        sourceDetail === 'ai_hybrid' || sourceDetail === 'ai_standalone' ? 'ai' :
        sourceDetail === 'database' ? 'database' : 'default';

    return {
        expectedLifespanMiles: estimate.expectedLifespanMiles,
        expectedLifespanYears: Math.round(estimate.expectedLifespanMiles / VEHICLE_CONSTANTS.avgMilesPerYear),
        baseLifespanMiles: estimate.expectedLifespanMiles,
        yearMultiplier: 1.0,
        adjustments: estimate.reasoning ? [{
            reason: estimate.reasoning,
            impact: 'neutral' as const,
            multiplier: 1.0,
        }] : [],
        confidence,
        source,
        sourceDetail,
        inDatabase,
        reasoning: estimate.reasoning || undefined,
    };
}

// === Complaint Summary Builder ===

export function buildComplaintSummary(complaints: Complaint[]): string | null {
    if (!complaints || complaints.length === 0) return null;

    const totalComplaints = complaints.length;
    const totalCrashes = complaints.filter(c => c.Crash).length;
    const totalFires = complaints.filter(c => c.Fire).length;
    const totalInjuries = complaints.reduce((sum, c) => sum + c.Injuries, 0);
    const totalDeaths = complaints.reduce((sum, c) => sum + c.Deaths, 0);

    // Group by component
    const componentCounts = new Map<string, number>();
    for (const c of complaints) {
        const comp = c.Component || 'UNKNOWN';
        componentCounts.set(comp, (componentCounts.get(comp) || 0) + 1);
    }

    const topComponents = Array.from(componentCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([comp, count]) => `${comp}: ${count}`)
        .join(', ');

    let summary = `Total NHTSA complaints: ${totalComplaints}`;
    if (totalCrashes > 0) summary += ` | Crashes: ${totalCrashes}`;
    if (totalFires > 0) summary += ` | Fires: ${totalFires}`;
    if (totalInjuries > 0) summary += ` | Injuries: ${totalInjuries}`;
    if (totalDeaths > 0) summary += ` | Deaths: ${totalDeaths}`;
    summary += `\nTop complaint components: ${topComponents}`;

    return summary;
}

// === AI Prompt Builders ===

const CALIBRATION_REFERENCE = `CALIBRATION REFERENCE (iSeeCars 2024 real-world average lifespan data — miles at which vehicles are typically retired):
- Toyota Camry: ~162,000 miles | Honda Accord: ~165,000 miles
- Toyota Tacoma: ~175,000 miles | Ford F-150: ~163,000 miles
- Honda CR-V: ~167,000 miles | Toyota Highlander: ~155,000 miles
- Subaru Outback: ~145,000 miles | Mazda CX-5: ~140,000 miles
- Hyundai Tucson: ~130,000 miles | Nissan Rogue: ~125,000 miles
- Chevrolet Equinox: ~120,000 miles | Jeep Cherokee: ~115,000 miles
- BMW 3 Series: ~110,000 miles | Mercedes C-Class: ~105,000 miles
- Jaguar F-Pace: ~90,000 miles | Land Rover Range Rover: ~85,000 miles`;

const HYBRID_SYSTEM_PROMPT = `You are a vehicle longevity expert calibrated to real-world survival data.
Your job: given a base expected lifespan from our database, refine it for a SPECIFIC model year.

${CALIBRATION_REFERENCE}

These represent the AVERAGE miles at which vehicles are retired from the road — NOT the maximum possible.
Most vehicles cluster between 120,000-200,000 miles. Outliers beyond 250,000 are rare.

IMPORTANT: Your estimate should represent the average miles this specific year/make/model
will travel before being retired from the road, NOT the maximum possible miles.

Return ONLY valid JSON, no markdown.`;

const STANDALONE_SYSTEM_PROMPT = `You are a vehicle longevity expert calibrated to real-world survival data.

${CALIBRATION_REFERENCE}

BRAND RELIABILITY TIERS (average lifespan ranges):
- Tier 1 (150,000-200,000): Toyota, Lexus, Honda
- Tier 2 (130,000-160,000): Mazda, Subaru, Acura, Hyundai (newer), Kia (newer)
- Tier 3 (110,000-140,000): Ford, Chevrolet, GMC, Nissan, Volkswagen, Volvo
- Tier 4 (90,000-120,000): BMW, Mercedes, Audi, Chrysler, Dodge, Jeep
- Tier 5 (70,000-100,000): Jaguar, Land Rover, Maserati, Alfa Romeo

These represent the AVERAGE miles at which vehicles are retired from the road.

IMPORTANT: Your estimate should represent the average miles this specific year/make/model
will travel before being retired from the road, NOT the maximum possible miles.

Return ONLY valid JSON, no markdown.`;

function buildHybridUserPrompt(
    make: string,
    model: string,
    year: number,
    dbLifespan: number,
    yearsToAvoid: number[],
    knownIssues: KnownIssueInput[],
    complaintSummary: string | null
): string {
    const isYearToAvoid = yearsToAvoid.includes(year);
    const yearIssues = knownIssues.filter(i => i.affectedYears?.includes(year));

    let prompt = `Our database estimates the ${make} ${model} (all years average) at ${dbLifespan.toLocaleString()} miles.

Refine this estimate for the SPECIFIC ${year} model year.

Vehicle: ${year} ${make} ${model}
Database base lifespan: ${dbLifespan.toLocaleString()} miles`;

    if (isYearToAvoid) {
        prompt += `\nWARNING: ${year} is flagged as a problematic year for this model.`;
    }

    if (yearIssues.length > 0) {
        prompt += `\nKnown issues affecting ${year}:`;
        for (const issue of yearIssues) {
            const desc = issue.description.length > 100 ? issue.description.slice(0, 97) + '...' : issue.description;
            prompt += `\n- ${issue.severity.toUpperCase()}: ${desc}`;
        }
    } else {
        prompt += '\nNo specific known issues for this year in our database.';
    }

    if (complaintSummary) {
        prompt += `\n\nNHTSA COMPLAINT DATA for ${year} ${make} ${model}:\n${complaintSummary}`;
    }

    const minMiles = Math.round(dbLifespan * AI_HYBRID_BOUNDS.minMultiplier);
    const maxMiles = Math.round(dbLifespan * AI_HYBRID_BOUNDS.maxMultiplier);

    prompt += `

Consider:
1. Which generation/platform is the ${year} model? Was this a good or bad generation?
2. What engine/transmission was standard for ${year}? Any known reliability differences vs other years?
3. Was ${year} a first-year redesign (higher risk) or a mature year in the production cycle (lower risk)?
4. How does the ${year} model's real-world reliability compare to the average across all years?

Your refined estimate must be between ${minMiles.toLocaleString()} and ${maxMiles.toLocaleString()} miles (${AI_HYBRID_BOUNDS.minMultiplier}x to ${AI_HYBRID_BOUNDS.maxMultiplier}x of our database value).

Return JSON: {"expectedLifespanMiles": number, "confidence": "high" or "medium", "reasoning": "2-3 sentences explaining why this year differs from the average", "yearMultiplier": number (${AI_HYBRID_BOUNDS.minMultiplier}-${AI_HYBRID_BOUNDS.maxMultiplier}, your adjustment to the base)}`;

    return prompt;
}

function buildStandaloneUserPrompt(
    make: string,
    model: string,
    year: number,
    complaintSummary: string | null
): string {
    let prompt = `Estimate the average expected lifespan in miles for a ${year} ${make} ${model}.

This vehicle is NOT in our database, so estimate based on:
1. Brand reliability reputation (see brand tiers in system prompt)
2. Vehicle segment (sedan, SUV, truck, etc.) and comparable models in the calibration data
3. Specific year/generation reliability if known
4. Engine/transmission options for this year and their reliability track record
5. Whether ${year} was a first-year redesign (higher risk) or a mature year in the production cycle`;

    if (complaintSummary) {
        prompt += `\n\nNHTSA COMPLAINT DATA for ${year} ${make} ${model}:\n${complaintSummary}`;
    }

    prompt += `

Return JSON: {"expectedLifespanMiles": number (${AI_STANDALONE_BOUNDS.minMiles}-${AI_STANDALONE_BOUNDS.maxMiles}), "confidence": "medium" or "low", "reasoning": "2-3 sentences explaining your estimate", "comparableVehicle": "Name of the most similar vehicle you used as a reference point"}`;

    return prompt;
}

// === AI Response Types ===

interface AIHybridResponse {
    expectedLifespanMiles: number;
    confidence: 'high' | 'medium';
    reasoning: string;
    yearMultiplier: number;
}

interface AIStandaloneResponse {
    expectedLifespanMiles: number;
    confidence: 'medium' | 'low';
    reasoning: string;
    comparableVehicle?: string;
}

// === AI Estimation Functions ===

async function estimateWithAIHybrid(
    make: string,
    model: string,
    year: number,
    dbLifespan: number,
    yearsToAvoid: number[],
    knownIssues: KnownIssueInput[],
    complaints: Complaint[]
): Promise<YearSpecificLifespan | null> {
    const client = getOpenAIClient();
    if (!client) return null;

    const complaintSummary = buildComplaintSummary(complaints);

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0,
            max_completion_tokens: 300,
            messages: [
                { role: 'system', content: HYBRID_SYSTEM_PROMPT },
                { role: 'user', content: buildHybridUserPrompt(make, model, year, dbLifespan, yearsToAvoid, knownIssues, complaintSummary) },
            ],
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return null;

        const parsed: AIHybridResponse = JSON.parse(content);

        // Validate expectedLifespanMiles
        let miles = parsed.expectedLifespanMiles;
        if (typeof miles !== 'number' || !Number.isFinite(miles)) return null;

        // Clamp to hybrid bounds
        const minMiles = Math.round(dbLifespan * AI_HYBRID_BOUNDS.minMultiplier);
        const maxMiles = Math.round(dbLifespan * AI_HYBRID_BOUNDS.maxMultiplier);
        miles = Math.max(minMiles, Math.min(maxMiles, Math.round(miles)));

        // Calculate actual multiplier from clamped result
        const actualMultiplier = Math.round((miles / dbLifespan) * 1000) / 1000;

        const confidence = parsed.confidence === 'high' ? 'high' : 'medium';
        const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';

        return {
            expectedLifespanMiles: miles,
            expectedLifespanYears: Math.round(miles / VEHICLE_CONSTANTS.avgMilesPerYear),
            baseLifespanMiles: dbLifespan,
            yearMultiplier: actualMultiplier,
            adjustments: reasoning ? [{
                reason: reasoning,
                impact: actualMultiplier >= 1.0 ? 'positive' as const : 'negative' as const,
                multiplier: actualMultiplier,
            }] : [],
            confidence,
            source: 'ai',
            sourceDetail: 'ai_hybrid',
            inDatabase: true,
            reasoning,
        };
    } catch (error) {
        console.warn('AI hybrid lifespan estimation failed:', error instanceof Error ? error.message : error);
        return null;
    }
}

async function estimateWithAIStandalone(
    make: string,
    model: string,
    year: number,
    complaints: Complaint[]
): Promise<YearSpecificLifespan | null> {
    const client = getOpenAIClient();
    if (!client) return null;

    const complaintSummary = buildComplaintSummary(complaints);

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0,
            max_completion_tokens: 300,
            messages: [
                { role: 'system', content: STANDALONE_SYSTEM_PROMPT },
                { role: 'user', content: buildStandaloneUserPrompt(make, model, year, complaintSummary) },
            ],
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) return null;

        const parsed: AIStandaloneResponse = JSON.parse(content);

        // Validate expectedLifespanMiles
        let miles = parsed.expectedLifespanMiles;
        if (typeof miles !== 'number' || !Number.isFinite(miles)) return null;

        // Clamp to standalone bounds
        miles = Math.max(AI_STANDALONE_BOUNDS.minMiles, Math.min(AI_STANDALONE_BOUNDS.maxMiles, Math.round(miles)));

        // Confidence never exceeds 'medium' without DB data
        const confidence = parsed.confidence === 'medium' ? 'medium' : 'low';
        const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';
        const comparableVehicle = typeof parsed.comparableVehicle === 'string' ? parsed.comparableVehicle : undefined;

        return {
            expectedLifespanMiles: miles,
            expectedLifespanYears: Math.round(miles / VEHICLE_CONSTANTS.avgMilesPerYear),
            baseLifespanMiles: miles,
            yearMultiplier: 1.0,
            adjustments: reasoning ? [{
                reason: reasoning,
                impact: 'neutral' as const,
                multiplier: 1.0,
            }] : [],
            confidence,
            source: 'ai',
            sourceDetail: 'ai_standalone',
            inDatabase: false,
            reasoning,
            comparableVehicle,
        };
    } catch (error) {
        console.warn('AI standalone lifespan estimation failed:', error instanceof Error ? error.message : error);
        return null;
    }
}

// === Deterministic Fallback (used when AI is unavailable for DB vehicles) ===

export function calculateFromDatabaseDeterministic(
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
        sourceDetail: 'database',
        inDatabase: true,
    };
}

// === Default Fallback ===

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
        sourceDetail: 'default',
        inDatabase: false,
    };
}

// === Main Function ===

/**
 * Calculates year-specific expected lifespan for a vehicle.
 *
 * Flow:
 * 1. Check in-memory cache (L1)
 * 2. Check PostgreSQL LifespanEstimate (L2, durable)
 * 3. If vehicle in static DB -> AI hybrid (DB anchor + AI refinement)
 *    If vehicle NOT in static DB -> AI standalone
 * 4. Persist to PostgreSQL + in-memory cache
 * 5. If AI unavailable -> deterministic fallback (DB) or default (130k)
 */
export async function calculateYearSpecificLifespan(
    make: string,
    model: string,
    year: number,
    complaints?: Complaint[]
): Promise<YearSpecificLifespan> {
    const cacheKey = getCacheKey(make, model, year);
    const complaintsList = complaints || [];
    const complaintCount = complaintsList.length;

    // Step 1: Check in-memory cache
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Step 2: Check PostgreSQL for persisted estimate
    const persisted = await getPersistedEstimate(make, model, year);
    if (persisted && !isEstimateStale(persisted, complaintCount)) {
        const relData = getReliabilityData(make, model);
        const result = buildResultFromPersisted(persisted, !!relData);
        setCache(cacheKey, result);
        return result;
    }

    // Step 3: Determine path — hybrid or standalone
    const relData = getReliabilityData(make, model);

    let result: YearSpecificLifespan;

    if (relData) {
        // Step 4a: Hybrid — DB anchor + AI refinement
        const aiResult = await estimateWithAIHybrid(
            make, model, year,
            relData.expectedLifespanMiles,
            relData.yearsToAvoid,
            relData.knownIssues || [],
            complaintsList
        );

        if (aiResult) {
            result = aiResult;
        } else {
            // AI unavailable — fall back to deterministic
            result = calculateFromDatabaseDeterministic(
                relData.expectedLifespanMiles,
                relData.yearsToAvoid,
                relData.knownIssues || [],
                make, model, year
            );
        }
    } else {
        // Step 4b: Standalone AI — no DB anchor
        const aiResult = await estimateWithAIStandalone(make, model, year, complaintsList);

        if (aiResult) {
            result = aiResult;
        } else {
            // AI unavailable — fall back to default
            result = buildDefaultEstimate(make, model, year);
        }
    }

    // Step 5: Persist AI results to PostgreSQL (only for AI-generated results)
    if (result.sourceDetail === 'ai_hybrid' || result.sourceDetail === 'ai_standalone') {
        await persistEstimate(make, model, year, result, complaintCount);
    }

    // Step 6: Set in-memory cache
    setCache(cacheKey, result);
    return result;
}

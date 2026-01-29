import OpenAI from 'openai';
import { INPUT_LIMITS } from './constants';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
    if (openaiClient) return openaiClient;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn('OPENAI_API_KEY not configured');
        return null;
    }

    openaiClient = new OpenAI({ apiKey });
    return openaiClient;
}

/**
 * Sanitizes user input to remove control characters and limit length
 */
function sanitizeInput(text: string): string {
    return text
        // Remove control characters (except newlines and tabs)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize whitespace
        .replace(/\r\n/g, '\n')
        // Limit length
        .substring(0, INPUT_LIMITS.maxListingLength);
}

export interface VehicleInfo {
    make: string;
    model: string;
    year: number;
}

export interface ExtractedVehicle {
    year: number | null;
    make: string | null;
    model: string | null;
    mileage: number | null;
    price: number | null;
}

export interface Concern {
    issue: string;
    severity: 'low' | 'medium' | 'high';
    explanation: string;
}

export interface InconsistencyFlag {
    type: 'mileage_age' | 'price_condition' | 'usage_wear' | 'owner_age' | 'description_conflict';
    description: string;
    severity: 'low' | 'medium' | 'high';
    details: string;
}

export interface SuspiciousPattern {
    type: 'vague_damage' | 'pressure_tactics' | 'deflection' | 'missing_info' | 'defensive_language' | 'too_good';
    phrase: string;
    explanation: string;
    severity: 'low' | 'medium' | 'high';
}

export interface AccidentHistoryInfo {
    hasAccident: boolean;
    severity?: 'minor' | 'moderate' | 'severe';
    details?: string;
}

export interface LifespanFactorsExtracted {
    maintenanceQuality: 'excellent' | 'good' | 'average' | 'poor' | null;
    maintenanceIndicators: string[];
    ownerCount: number | null;
    accidentHistory: AccidentHistoryInfo;
    usagePattern: 'highway' | 'city' | 'mixed' | 'severe' | null;
    conditionIndicators: string[];
    estimatedCondition: 'excellent' | 'good' | 'fair' | 'poor' | null;
}

export interface AIAnalysisResult {
    extractedVehicle: ExtractedVehicle | null;
    concerns: Concern[];
    inconsistencies: InconsistencyFlag[];
    suspiciousPatterns: SuspiciousPattern[];
    trustworthinessScore: number;
    suggestedQuestions: string[];
    overallImpression: string;
    lifespanFactors: LifespanFactorsExtracted;
    rawResponse?: string;
    isFallback?: boolean;
}

/**
 * Analyzes vehicle listing text using OpenAI GPT.
 */
export async function analyzeListingWithAI(
    listingText: string,
    vehicleInfo?: VehicleInfo
): Promise<AIAnalysisResult> {
    const openai = getOpenAIClient();
    if (!openai) {
        return getFallbackAnalysis();
    }

    // Sanitize input to remove control characters and limit length
    const cleanListing = sanitizeInput(listingText);

    if (cleanListing.length < 10) {
        return getFallbackAnalysis('Listing text too short for analysis');
    }

    const prompt = `
Analyze this used car listing for information extraction AND potential deception/inconsistencies:

LISTING:
${cleanListing}

${vehicleInfo ? `Known Context: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : ''}

Return a JSON object with:

1. extractedVehicle: { year, make, model, mileage, price } (null if not found)

2. concerns: [{ issue: string, severity: "low"|"medium"|"high", explanation: string }]

3. inconsistencies: Check for logical contradictions and flag them:
   [{ type: "mileage_age"|"price_condition"|"usage_wear"|"owner_age"|"description_conflict",
      description: string,
      severity: "low"|"medium"|"high",
      details: string }]

   IMPORTANT MILEAGE CONTEXT: Average driving is 12,000-15,000 miles per year.
   - A 10-year-old car with 120,000-150,000 miles is NORMAL, not high mileage.
   - A 10-year-old car with 80,000 miles is BELOW average - this is GOOD, not concerning.
   - Only flag mileage if it's SUSPICIOUSLY LOW (e.g., 20k on a 10-year daily driver suggests odometer issues or sitting unused) or VERY HIGH (over 20k/year average).

   Examples to check:
   - mileage_age: A 2015 daily driver with only 20k miles is suspicious (too low)
   - price_condition: "Perfect condition" but priced 40% below market suggests hidden issues
   - usage_wear: "Highway miles only" but mentions high brake wear doesn't add up
   - owner_age: "One owner" on a 15+ year old vehicle may need verification
   - description_conflict: Contradicting statements within the listing

   DO NOT flag normal or below-average mileage as "high mileage" - that's incorrect.

4. suspiciousPatterns: Look for deceptive language patterns:
   [{ type: "vague_damage"|"pressure_tactics"|"deflection"|"missing_info"|"defensive_language"|"too_good",
      phrase: string (quote from listing),
      explanation: string,
      severity: "low"|"medium"|"high" }]
   Patterns to detect:
   - vague_damage: "minor cosmetic issue", "small scratch", "tiny dent" (minimizing language)
   - pressure_tactics: "must sell today", "first come first served", "won't last", "serious buyers only"
   - deflection: "runs great for its age", "just needs...", "easy fix"
   - missing_info: Important details conspicuously absent (no mention of service history, accidents when asked)
   - defensive_language: "nothing wrong with it", "don't lowball me", "I know what I have"
   - too_good: Claims that seem unrealistically positive

5. trustworthinessScore: number 1-10 (penalize for inconsistencies and suspicious patterns)

6. suggestedQuestions: string[] (specific questions to verify suspicious items)

7. overallImpression: string (2-3 sentences including any red flags found)

8. lifespanFactors: {
    maintenanceQuality: "excellent"|"good"|"average"|"poor"|null,
    maintenanceIndicators: string[],
    ownerCount: number|null,
    accidentHistory: { hasAccident: boolean, severity: "minor"|"moderate"|"severe"|null, details: string|null },
    usagePattern: "highway"|"city"|"mixed"|"severe"|null,
    conditionIndicators: string[],
    estimatedCondition: "excellent"|"good"|"fair"|"poor"|null
}

Be skeptical but fair. Flag genuine concerns but don't be paranoid about normal listings.
DO NOT penalize vehicles for having normal or below-average mileage for their age.
Remember: 12-15k miles/year is average. 80k miles on a 10-year-old car is BELOW average and good.

Output PURE JSON ONLY. No markdown blocks.
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            max_completion_tokens: 1000,
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content: "You are an expert used car buyer and mechanic assistant. You analyze listings for risks, red flags, and good deals. You respond only in valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from OpenAI');
        }

        const jsonString = content.trim().replace(/^```json\s*/, '').replace(/```$/, '');

        // Attempt parse
        try {
            const result = JSON.parse(jsonString) as AIAnalysisResult;
            // Ensure all fields have default values if AI didn't return them
            const lifespanFactors = result.lifespanFactors || getDefaultLifespanFactors();
            return {
                ...result,
                inconsistencies: result.inconsistencies || [],
                suspiciousPatterns: result.suspiciousPatterns || [],
                lifespanFactors: {
                    ...getDefaultLifespanFactors(),
                    ...lifespanFactors,
                },
                isFallback: false,
            };
        } catch (parseError) {
            // Log only that parsing failed, not the content (security)
            console.error('Failed to parse AI response JSON (length:', content.length, ')');
            return getFallbackAnalysis('AI response was not valid JSON');
        }

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return getFallbackAnalysis();
    }
}

function getDefaultLifespanFactors(): LifespanFactorsExtracted {
    return {
        maintenanceQuality: null,
        maintenanceIndicators: [],
        ownerCount: null,
        accidentHistory: { hasAccident: false },
        usagePattern: null,
        conditionIndicators: [],
        estimatedCondition: null,
    };
}

function getFallbackAnalysis(rawResponse?: string): AIAnalysisResult {
    return {
        extractedVehicle: null,
        concerns: [{
            issue: 'AI Analysis Unavailable',
            severity: 'low',
            explanation: 'Could not perform advanced AI analysis at this time. Relying on basic checks.'
        }],
        inconsistencies: [],
        suspiciousPatterns: [],
        trustworthinessScore: 5,
        suggestedQuestions: ['Can you provide more details about the condition?'],
        overallImpression: 'Unable to generate detailed impression. Please review listing manually.',
        lifespanFactors: getDefaultLifespanFactors(),
        isFallback: true,
        rawResponse
    };
}

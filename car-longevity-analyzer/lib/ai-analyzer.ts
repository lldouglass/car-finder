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

export interface AIAnalysisResult {
    extractedVehicle: ExtractedVehicle | null;
    concerns: Concern[];
    trustworthinessScore: number;
    suggestedQuestions: string[];
    overallImpression: string;
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
Analyze this used car listing and extract information:

LISTING:
${cleanListing}

${vehicleInfo ? `Known Context: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : ''}

Return a JSON object with:
- extractedVehicle: { year, make, model, mileage, price } (null if not found)
- concerns: [{ issue: string, severity: "low"|"medium"|"high", explanation: string }]
- trustworthinessScore: number (1-10)
- suggestedQuestions: string[]
- overallImpression: string (2-3 sentences)

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
            return { ...result, isFallback: false };
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

function getFallbackAnalysis(rawResponse?: string): AIAnalysisResult {
    return {
        extractedVehicle: null,
        concerns: [{
            issue: 'AI Analysis Unavailable',
            severity: 'low',
            explanation: 'Could not perform advanced AI analysis at this time. Relying on basic checks.'
        }],
        trustworthinessScore: 5,
        suggestedQuestions: ['Can you provide more details about the condition?'],
        overallImpression: 'Unable to generate detailed impression. Please review listing manually.',
        isFallback: true,
        rawResponse
    };
}

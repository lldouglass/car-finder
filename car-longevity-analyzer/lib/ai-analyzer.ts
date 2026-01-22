import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

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
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not set. Returning fallback analysis.');
        return getFallbackAnalysis();
    }

    // Sanitize input roughly to avoid too large prompts
    const cleanListing = listingText.substring(0, 15000); // 15k chars safety limit

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
            model: "gpt-5-mini",
            max_tokens: 1000,
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
            console.error('Failed to parse AI response JSON:', content);
            return getFallbackAnalysis(content);
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

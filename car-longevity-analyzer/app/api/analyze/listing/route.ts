import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeListingWithAI } from '@/lib/ai-analyzer';
import {
    calculateReliabilityScore,
    calculateLongevityScore,
    calculatePriceScore,
    calculateOverallScore
} from '@/lib/scoring';
import {
    detectRedFlags,
    detectPriceAnomaly,
    generateQuestionsForSeller
} from '@/lib/red-flags';
import { getReliabilityData } from '@/lib/reliability-data';
import { estimateFairPrice } from '@/lib/pricing';
import { INPUT_LIMITS, VEHICLE_CONSTANTS } from '@/lib/constants';

const AnalyzeListingSchema = z.object({
    listingText: z.string()
        .min(10, "Listing text is too short")
        .max(INPUT_LIMITS.maxListingLength, "Listing text exceeds maximum length"),
    askingPrice: z.number().nonnegative().max(INPUT_LIMITS.maxPrice).optional(),
    mileage: z.number().nonnegative().max(INPUT_LIMITS.maxMileage).optional()
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validate Input
        const result = AnalyzeListingSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: "Validation Error", details: result.error.errors },
                { status: 400 }
            );
        }

        const { listingText } = result.data;
        let { askingPrice, mileage } = result.data;

        // 2. AI Analysis to extract info
        const aiResult = await analyzeListingWithAI(listingText);
        const extracted = aiResult.extractedVehicle;

        // Fill gaps from AI if not provided in body
        if (askingPrice === undefined && extracted?.price) askingPrice = extracted.price;
        if (mileage === undefined && extracted?.mileage) mileage = extracted.mileage;

        const make = extracted?.make || 'Unknown';
        const model = extracted?.model || 'Unknown';
        // Use constant for fallback age calculation
        const year = extracted?.year || new Date().getFullYear() - VEHICLE_CONSTANTS.defaultFallbackAge;

        // 3. Scores Calculation (if sufficient data)
        let reliabilityScore = 0;
        let longevityResult: any = null;
        let priceResult: any = null;
        let overallResult: any = null;
        let priceEstimate: { low: number; high: number } | null = null;

        // Reliability
        if (extracted?.make && extracted?.model) {
            reliabilityScore = calculateReliabilityScore(make, model, year, []);
        }

        // Longevity
        if (mileage !== undefined) {
            const relData = getReliabilityData(make, model);
            const expectedLifespan = relData ? relData.expectedLifespanMiles : 200000;
            longevityResult = calculateLongevityScore(expectedLifespan, mileage);
        }

        // Price
        if (askingPrice !== undefined && mileage !== undefined && extracted?.make) {
            priceEstimate = estimateFairPrice(make, model, year, mileage);
            priceResult = calculatePriceScore(askingPrice, priceEstimate.low, priceEstimate.high);
        }

        // 4. Red Flags
        const regexRedFlags = detectRedFlags(listingText);

        // Merge AI concerns into red flags structure?
        const aiRedFlags = aiResult.concerns.map(c => ({
            type: 'ai_concern',
            severity: c.severity,
            message: c.issue,
            advice: c.explanation
        }));

        let allRedFlags = [...regexRedFlags, ...aiRedFlags];

        // Price anomaly check
        if (priceResult && askingPrice !== undefined && priceEstimate) {
            const priceFlag = detectPriceAnomaly(askingPrice, priceEstimate.low, priceEstimate.high);
            if (priceFlag) allRedFlags.push(priceFlag);
        }

        // Overall Score
        if (reliabilityScore > 0 && longevityResult && priceResult) {
            overallResult = calculateOverallScore(
                reliabilityScore,
                longevityResult.score,
                priceResult.score,
                allRedFlags
            );
        }

        // 5. Questions
        const questions = generateQuestionsForSeller(
            { make, model, year },
            allRedFlags,
            [] // No recalls from just listing text
        );
        // Combine with AI suggested questions
        const allQuestions = Array.from(new Set([...questions, ...aiResult.suggestedQuestions]));

        return NextResponse.json({
            success: true,
            vehicle: {
                year: extracted?.year,
                make: extracted?.make,
                model: extracted?.model,
                trim: null, // Hard to extract reliably without VIN
            },
            scores: {
                reliability: reliabilityScore || null,
                longevity: longevityResult?.score || null,
                priceValue: priceResult?.score || null,
                overall: overallResult?.score || null
            },
            longevity: longevityResult ? {
                estimatedRemainingMiles: longevityResult.remainingMiles,
                remainingYears: longevityResult.remainingYears,
                percentUsed: longevityResult.percentUsed
            } : null,
            pricing: priceResult ? {
                askingPrice,
                fairPriceLow: priceEstimate?.low,
                fairPriceHigh: priceEstimate?.high,
                dealQuality: priceResult.dealQuality,
                analysis: priceResult.analysis
            } : null,
            aiAnalysis: {
                trustworthiness: aiResult.trustworthinessScore,
                impression: aiResult.overallImpression,
                concerns: aiResult.concerns
            },
            redFlags: allRedFlags,
            recommendation: {
                verdict: overallResult?.recommendation || 'MAYBE', // Default if incomplete
                confidence: overallResult?.confidence || 0.5,
                summary: overallResult?.summary || aiResult.overallImpression,
                questionsForSeller: allQuestions
            }
        });

    } catch (error) {
        console.error("Listing Analysis Error:", error);

        // Handle JSON parse errors
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { success: false, error: "Invalid request body" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Internal Server Error", retryable: true },
            { status: 500 }
        );
    }
}

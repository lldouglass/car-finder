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

const AnalyzeListingSchema = z.object({
    listingText: z.string().min(10, "Listing text is too short"),
    askingPrice: z.number().nonnegative().optional(),
    mileage: z.number().nonnegative().optional()
});

// Mock/heuristic helpers (duplicated from VIN route for independence/speed)
function estimateFairPrice(originalMsrp: number, year: number, mileage: number): { low: number, high: number } {
    const age = new Date().getFullYear() - year;
    let depreciation = 0.15; // Year 1
    for (let i = 1; i < age; i++) {
        depreciation += 0.10; // Subsequent years
    }
    const avgMilesPerYear = 12000;
    const excessMiles = Math.max(0, mileage - (age * avgMilesPerYear));
    const mileagePenalty = (excessMiles / 10000) * 0.02;

    const totalDepreciation = Math.min(0.90, depreciation + mileagePenalty);
    const estimatedValue = originalMsrp * (1 - totalDepreciation);

    return {
        low: Math.round(estimatedValue * 0.9),
        high: Math.round(estimatedValue * 1.1)
    };
}

function getApproximateMsrp(make: string, model: string): number {
    const key = `${make.toLowerCase()} ${model.toLowerCase()}`;
    if (key.includes('camry')) return 28000;
    if (key.includes('corolla')) return 22000;
    if (key.includes('civic')) return 24000;
    if (key.includes('accord')) return 29000;
    if (key.includes('f-150')) return 40000;
    if (key.includes('silverado')) return 42000;
    if (key.includes('bmw')) return 50000;
    if (key.includes('mercedes')) return 55000;
    return 30000;
}

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
        const year = extracted?.year || new Date().getFullYear() - 5; // Fallback to avg age if unknown

        // 3. Scores Calculation (if sufficient data)
        let reliabilityScore = 0;
        let longevityResult: any = null;
        let priceResult: any = null;
        let overallResult: any = null;
        let estimatedFairPrice: any = null;

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
            const msrp = getApproximateMsrp(make, model);
            const { low, high } = estimateFairPrice(msrp, year, mileage);
            estimatedFairPrice = { low, high };
            priceResult = calculatePriceScore(askingPrice, low, high);
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
        if (priceResult && askingPrice !== undefined && estimatedFairPrice) {
            const priceFlag = detectPriceAnomaly(askingPrice, estimatedFairPrice.low, estimatedFairPrice.high);
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
                fairPriceLow: estimatedFairPrice?.low,
                fairPriceHigh: estimatedFairPrice?.high,
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
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

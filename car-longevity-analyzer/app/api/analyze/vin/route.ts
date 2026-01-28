import { NextResponse } from 'next/server';
import { z } from 'zod';
import { decodeVin, getRecalls, getComplaints, getSafetyRatings } from '@/lib/nhtsa';
import {
    calculateLongevityScore,
    calculatePriceScore,
    calculateOverallScore
} from '@/lib/scoring';
import { calculateDynamicReliability } from '@/lib/dynamic-reliability';
import {
    detectRedFlags,
    detectPriceAnomaly,
    generateQuestionsForSeller
} from '@/lib/red-flags';
import { calculateSafetyScore, detectSafetyRedFlags } from '@/lib/safety-scoring';
import { getReliabilityData } from '@/lib/reliability-data';
import { estimateFairPrice } from '@/lib/pricing';
import { INPUT_LIMITS, LIFESPAN_ADJUSTMENT_LIMITS } from '@/lib/constants';
import { calculateAdjustedLifespan, type LifespanFactors } from '@/lib/lifespan-factors';
import { mapVinToLifespanFactors, mergeLifespanFactors } from '@/lib/vin-factor-mapper';
import { getClimateRegion } from '@/lib/region-mapper';
import { extractKnownIssues } from '@/lib/complaint-analyzer';

// Schema for request validation
const AnalyzeVinSchema = z.object({
    vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Invalid VIN format (cannot contain I, O, Q)"),
    mileage: z.number().nonnegative().max(INPUT_LIMITS.maxMileage, "Mileage exceeds maximum"),
    askingPrice: z.number().nonnegative().max(INPUT_LIMITS.maxPrice, "Price exceeds maximum"),
    listingText: z.string().max(INPUT_LIMITS.maxListingLength).optional(),
    location: z.string().max(100).optional(),
});

class AnalysisError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public isRetryable: boolean = false
    ) {
        super(message);
        this.name = 'AnalysisError';
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const result = AnalyzeVinSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: "Validation Error", details: result.error.issues },
                { status: 400 }
            );
        }

        const { vin, mileage, askingPrice, listingText, location } = result.data;

        const vehicle = await decodeVin(vin);
        if (!vehicle) {
            return NextResponse.json(
                { success: false, error: "Could not decode VIN" },
                { status: 404 }
            );
        }

        const [recallsResult, complaintsResult, safetyResult] = await Promise.allSettled([
            getRecalls(vehicle.make, vehicle.model, vehicle.year),
            getComplaints(vehicle.make, vehicle.model, vehicle.year),
            getSafetyRatings(vehicle.make, vehicle.model, vehicle.year)
        ]);

        const recalls = recallsResult.status === 'fulfilled' ? recallsResult.value : [];
        const complaints = complaintsResult.status === 'fulfilled' ? complaintsResult.value : [];
        const safetyRatingData = safetyResult.status === 'fulfilled' ? safetyResult.value : null;

        if (recallsResult.status === 'rejected') {
            console.warn('Failed to fetch recalls:', recallsResult.reason);
        }
        if (complaintsResult.status === 'rejected') {
            console.warn('Failed to fetch complaints:', complaintsResult.reason);
        }
        if (safetyResult.status === 'rejected') {
            console.warn('Failed to fetch safety ratings:', safetyResult.reason);
        }

        const relData = getReliabilityData(vehicle.make, vehicle.model);
        const baseLifespan = relData ? relData.expectedLifespanMiles : LIFESPAN_ADJUSTMENT_LIMITS.defaultLifespan;

        const vinFactors = mapVinToLifespanFactors(vehicle, vehicle.transmissionStyle);
        const climateRegion = getClimateRegion(location);

        const lifespanFactors: LifespanFactors = mergeLifespanFactors(
            vinFactors,
            {},
            climateRegion
        );

        const lifespanAnalysis = calculateAdjustedLifespan(baseLifespan, lifespanFactors);
        const expectedLifespan = lifespanAnalysis.adjustedLifespan;

        const reliabilityResult = calculateDynamicReliability(
            vehicle.make,
            vehicle.model,
            vehicle.year,
            complaints,
            safetyRatingData
        );
        const reliabilityScore = reliabilityResult.score;

        const longevityResult = calculateLongevityScore(expectedLifespan, mileage);

        const priceEstimate = estimateFairPrice(vehicle.make, vehicle.model, vehicle.year, mileage);
        const priceResult = calculatePriceScore(askingPrice, priceEstimate.low, priceEstimate.high);

        const safetyScoreResult = calculateSafetyScore(safetyRatingData, complaints, vehicle.year);

        const redFlags = listingText ? detectRedFlags(listingText) : [];
        const priceRedFlag = detectPriceAnomaly(askingPrice, priceEstimate.low, priceEstimate.high);
        if (priceRedFlag) redFlags.push(priceRedFlag);

        const safetyRedFlags = detectSafetyRedFlags(safetyScoreResult, complaints);
        redFlags.push(...safetyRedFlags);

        const overallResult = calculateOverallScore(
            reliabilityScore,
            longevityResult.score,
            priceResult.score,
            redFlags,
            safetyScoreResult.score
        );

        const questions = generateQuestionsForSeller(
            { make: vehicle.make, model: vehicle.model, year: vehicle.year },
            redFlags,
            recalls
        );

        return NextResponse.json({
            success: true,
            vehicle,
            scores: {
                reliability: reliabilityScore,
                longevity: longevityResult.score,
                priceValue: priceResult.score,
                safety: safetyScoreResult.score,
                overall: overallResult.score
            },
            longevity: {
                expectedLifespan,
                baseLifespan,
                estimatedRemainingMiles: longevityResult.remainingMiles,
                remainingYears: longevityResult.remainingYears,
                percentUsed: longevityResult.percentUsed
            },
            lifespanAnalysis: {
                baseLifespan: lifespanAnalysis.baseLifespan,
                adjustedLifespan: lifespanAnalysis.adjustedLifespan,
                totalMultiplier: lifespanAnalysis.totalMultiplier,
                appliedFactors: lifespanAnalysis.appliedFactors,
                confidence: lifespanAnalysis.confidence,
            },
            pricing: {
                askingPrice,
                fairPriceLow: priceEstimate.low,
                fairPriceHigh: priceEstimate.high,
                dealQuality: priceResult.dealQuality,
                analysis: priceResult.analysis
            },
            safety: {
                score: safetyScoreResult.score,
                breakdown: safetyScoreResult.breakdown,
                confidence: safetyScoreResult.confidence,
                hasCrashTestData: safetyScoreResult.hasCrashTestData,
            },
            knownIssues: extractKnownIssues(complaints),
            reliabilityBreakdown: reliabilityResult.breakdown,
            recalls: recalls.map(r => ({ component: r.Component, summary: r.Summary, date: r.ReportReceivedDate })).slice(0, 5),
            safetyRating: safetyRatingData ? {
                overallRating: safetyRatingData.OverallRating,
                frontalCrashRating: safetyRatingData.FrontalCrashRating,
                sideCrashRating: safetyRatingData.SideCrashRating,
                rolloverRating: safetyRatingData.RolloverRating,
                complaintsCount: safetyRatingData.ComplaintsCount,
                recallsCount: safetyRatingData.RecallsCount,
            } : null,
            redFlags,
            recommendation: {
                verdict: overallResult.recommendation,
                confidence: overallResult.confidence,
                summary: overallResult.summary,
                questionsForSeller: questions
            }
        });

    } catch (error) {
        console.error("Analysis Error:", error);

        if (error instanceof AnalysisError) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                    retryable: error.isRetryable
                },
                { status: error.statusCode }
            );
        }

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

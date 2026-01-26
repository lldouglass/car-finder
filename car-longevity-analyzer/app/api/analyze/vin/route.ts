import { NextResponse } from 'next/server';
import { z } from 'zod';
import { decodeVin, getRecalls, getComplaints } from '@/lib/nhtsa';
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

// Schema for request validation
const AnalyzeVinSchema = z.object({
    vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Invalid VIN format (cannot contain I, O, Q)"),
    mileage: z.number().nonnegative(),
    askingPrice: z.number().nonnegative(),
    listingText: z.string().optional()
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validate Input
        const result = AnalyzeVinSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: "Validation Error", details: result.error.errors },
                { status: 400 }
            );
        }

        const { vin, mileage, askingPrice, listingText } = result.data;

        // 2. Decode VIN
        const vehicle = await decodeVin(vin);
        if (!vehicle) {
            return NextResponse.json(
                { success: false, error: "Could not decode VIN" },
                { status: 404 }
            );
        }

        // 3. Fetch Data (Parallel)
        const [recalls, complaints] = await Promise.all([
            getRecalls(vehicle.make, vehicle.model, vehicle.year),
            getComplaints(vehicle.make, vehicle.model, vehicle.year)
        ]);

        // 4. Look up Reliability Data
        const relData = getReliabilityData(vehicle.make, vehicle.model);
        const expectedLifespan = relData ? relData.expectedLifespanMiles : 200000;

        // 5. Calculate Scores

        // Reliability
        // We don't have "Known Issues" database fully populated yet, so we'll infer some from complaints/recalls roughly
        // Or just pass empty array for now + relying on hardcoded reliability base score
        const reliabilityScore = calculateReliabilityScore(
            vehicle.make,
            vehicle.model,
            vehicle.year,
            []
        );

        // Longevity
        const longevityResult = calculateLongevityScore(expectedLifespan, mileage);

        // Price
        const priceEstimate = estimateFairPrice(vehicle.make, vehicle.model, vehicle.year, mileage);
        const priceResult = calculatePriceScore(askingPrice, priceEstimate.low, priceEstimate.high);

        // Red Flags
        const redFlags = listingText ? detectRedFlags(listingText) : [];
        const priceRedFlag = detectPriceAnomaly(askingPrice, priceEstimate.low, priceEstimate.high);
        if (priceRedFlag) redFlags.push(priceRedFlag);

        // Overall
        const overallResult = calculateOverallScore(
            reliabilityScore,
            longevityResult.score,
            priceResult.score,
            redFlags
        );

        // 6. Generate Questions
        const questions = generateQuestionsForSeller(
            { make: vehicle.make, model: vehicle.model, year: vehicle.year },
            redFlags,
            recalls
        );

        // 7. Response
        return NextResponse.json({
            success: true,
            vehicle,
            scores: {
                reliability: reliabilityScore,
                longevity: longevityResult.score,
                priceValue: priceResult.score,
                overall: overallResult.score
            },
            longevity: {
                estimatedRemainingMiles: longevityResult.remainingMiles,
                remainingYears: longevityResult.remainingYears,
                percentUsed: longevityResult.percentUsed
            },
            pricing: {
                askingPrice,
                fairPriceLow: priceEstimate.low,
                fairPriceHigh: priceEstimate.high,
                dealQuality: priceResult.dealQuality,
                analysis: priceResult.analysis
            },
            knownIssues: [], // TODO: Populate from real database
            recalls: recalls.map(r => ({ component: r.Component, summary: r.Summary, date: r.ReportReceivedDate })).slice(0, 5), // Limit size
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
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

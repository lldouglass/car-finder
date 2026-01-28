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
import { INPUT_LIMITS, LIFESPAN_ADJUSTMENT_LIMITS } from '@/lib/constants';
import { calculateAdjustedLifespan, type LifespanFactors } from '@/lib/lifespan-factors';
import { mapVinToLifespanFactors, mergeLifespanFactors } from '@/lib/vin-factor-mapper';
import { getClimateRegion } from '@/lib/region-mapper';
import { calculateMaintenanceProjections } from '@/lib/maintenance-data';

// Schema for request validation
const AnalyzeVinSchema = z.object({
    vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Invalid VIN format (cannot contain I, O, Q)"),
    mileage: z.number().nonnegative().max(INPUT_LIMITS.maxMileage, "Mileage exceeds maximum"),
    askingPrice: z.number().nonnegative().max(INPUT_LIMITS.maxPrice, "Price exceeds maximum"),
    listingText: z.string().max(INPUT_LIMITS.maxListingLength).optional(),
    location: z.string().max(100).optional(), // State code or name for climate region
});

// Custom error class for better error handling
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

        // 1. Validate Input
        const result = AnalyzeVinSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: "Validation Error", details: result.error.issues },
                { status: 400 }
            );
        }

        const { vin, mileage, askingPrice, listingText, location } = result.data;

        // 2. Decode VIN
        const vehicle = await decodeVin(vin);
        if (!vehicle) {
            return NextResponse.json(
                { success: false, error: "Could not decode VIN" },
                { status: 404 }
            );
        }

        // 3. Fetch Data (Parallel) - Use allSettled for graceful degradation
        const [recallsResult, complaintsResult] = await Promise.allSettled([
            getRecalls(vehicle.make, vehicle.model, vehicle.year),
            getComplaints(vehicle.make, vehicle.model, vehicle.year)
        ]);

        // Extract results with fallbacks
        const recalls = recallsResult.status === 'fulfilled' ? recallsResult.value : [];
        const complaints = complaintsResult.status === 'fulfilled' ? complaintsResult.value : [];

        // Log if any fetch failed but continue with partial data
        if (recallsResult.status === 'rejected') {
            console.warn('Failed to fetch recalls:', recallsResult.reason);
        }
        if (complaintsResult.status === 'rejected') {
            console.warn('Failed to fetch complaints:', complaintsResult.reason);
        }

        // 4. Look up Reliability Data
        const relData = getReliabilityData(vehicle.make, vehicle.model);
        const baseLifespan = relData ? relData.expectedLifespanMiles : LIFESPAN_ADJUSTMENT_LIMITS.defaultLifespan;

        // 5. Calculate Lifespan Factors from VIN data
        const vinFactors = mapVinToLifespanFactors(vehicle, vehicle.transmissionStyle);
        const climateRegion = getClimateRegion(location);

        // Merge factors (no AI factors for VIN-only analysis)
        const lifespanFactors: LifespanFactors = mergeLifespanFactors(
            vinFactors,
            {}, // No AI-extracted factors for pure VIN analysis
            climateRegion
        );

        // Calculate adjusted lifespan
        const lifespanAnalysis = calculateAdjustedLifespan(baseLifespan, lifespanFactors);
        const expectedLifespan = lifespanAnalysis.adjustedLifespan;

        // 6. Calculate Scores

        // Reliability - calculate breakdown for transparency
        const reliabilityBaseScore = relData ? relData.baseScore : 5.0;
        const isYearToAvoid = relData?.yearsToAvoid.includes(vehicle.year) || false;
        let reliabilityYearAdjustment = 0;
        if (isYearToAvoid) {
            reliabilityYearAdjustment = -2.0;
        } else if (vehicle.year >= 2018) {
            reliabilityYearAdjustment = 0.5;
        }
        const reliabilityScore = Math.max(1, Math.min(10, reliabilityBaseScore + reliabilityYearAdjustment));

        // Longevity (using adjusted lifespan)
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

        // 7. Aggregate complaints by component
        const componentMap = new Map<string, {
            count: number;
            hasCrashes: boolean;
            hasFires: boolean;
            hasInjuries: boolean;
            summaries: string[];
        }>();

        for (const complaint of complaints) {
            const component = complaint.Component || 'UNKNOWN';
            const existing = componentMap.get(component) || {
                count: 0,
                hasCrashes: false,
                hasFires: false,
                hasInjuries: false,
                summaries: [],
            };

            existing.count++;
            existing.hasCrashes = existing.hasCrashes || complaint.Crash;
            existing.hasFires = existing.hasFires || complaint.Fire;
            existing.hasInjuries = existing.hasInjuries || (complaint.Injuries > 0);

            // Keep up to 3 sample summaries per component
            if (existing.summaries.length < 3 && complaint.Summary) {
                existing.summaries.push(complaint.Summary.slice(0, 200));
            }

            componentMap.set(component, existing);
        }

        // Convert to array and sort by count (most complaints first)
        const componentIssues = Array.from(componentMap.entries())
            .map(([component, data]) => ({
                component,
                count: data.count,
                hasCrashes: data.hasCrashes,
                hasFires: data.hasFires,
                hasInjuries: data.hasInjuries,
                sampleComplaints: data.summaries,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Limit to top 10 components

        // 8. Calculate Maintenance Projections
        const maintenanceCost = calculateMaintenanceProjections(
            vehicle.make,
            vehicle.model,
            vehicle.year,
            mileage
        );

        // 9. Response
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
            reliabilityAnalysis: {
                baseScore: reliabilityBaseScore,
                yearAdjustment: reliabilityYearAdjustment,
                isYearToAvoid,
                inDatabase: !!relData,
            },
            pricing: {
                askingPrice,
                fairPriceLow: priceEstimate.low,
                fairPriceHigh: priceEstimate.high,
                dealQuality: priceResult.dealQuality,
                analysis: priceResult.analysis
            },
            componentIssues,
            maintenanceCost,
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

        // Handle known error types
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

        // Handle JSON parse errors
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { success: false, error: "Invalid request body" },
                { status: 400 }
            );
        }

        // Generic server error
        return NextResponse.json(
            { success: false, error: "Internal Server Error", retryable: true },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { decodeVin, getRecalls, getComplaints, getSafetyRatings } from '@/lib/nhtsa';
import {
    calculateLongevityScore,
    calculatePriceScore,
    calculateOverallScore,
    calculatePriceThresholds
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
import { assessSellerRisk, type SellerType } from '@/lib/seller-risk';
import { generateNegotiationStrategy } from '@/lib/negotiation-advisor';
import { calculateMaintenanceCosts } from '@/lib/maintenance-costs';
import { generateInspectionChecklist } from '@/lib/inspection-checklist';
import { calculateWarrantyValue, detectWarrantyFromListing, type WarrantyInfo } from '@/lib/warranty-value';
import { calculateMaintenanceProjections } from '@/lib/maintenance-data';

// Seller type enum for validation
const SellerTypeEnum = z.enum(['cpo', 'franchise_same', 'franchise_other', 'independent_lot', 'private', 'auction', 'unknown']);

// Schema for request validation
const AnalyzeVinSchema = z.object({
    vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Invalid VIN format (cannot contain I, O, Q)"),
    mileage: z.number().nonnegative().max(INPUT_LIMITS.maxMileage, "Mileage exceeds maximum"),
    askingPrice: z.number().nonnegative().max(INPUT_LIMITS.maxPrice, "Price exceeds maximum"),
    listingText: z.string().max(INPUT_LIMITS.maxListingLength).optional(),
    location: z.string().max(100).optional(),
    sellerType: SellerTypeEnum.optional(),
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

        const { vin, mileage, askingPrice, listingText, location, sellerType } = result.data;

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

        // Calculate reliability using dynamic system
        const reliabilityResult = calculateDynamicReliability(
            vehicle.make,
            vehicle.model,
            vehicle.year,
            complaints,
            safetyRatingData
        );
        const reliabilityScore = reliabilityResult.score;

        // Calculate reliability breakdown for transparency
        const reliabilityBaseScore = relData ? relData.baseScore : 5.0;
        const isYearToAvoid = relData?.yearsToAvoid.includes(vehicle.year) || false;
        let reliabilityYearAdjustment = 0;
        if (isYearToAvoid) {
            reliabilityYearAdjustment = -2.0;
        } else if (vehicle.year >= 2018) {
            reliabilityYearAdjustment = 0.5;
        }

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

        // New feature calculations
        const knownIssues = extractKnownIssues(complaints);

        // Seller Risk Assessment
        const sellerRisk = assessSellerRisk(
            (sellerType as SellerType) || 'unknown',
            listingText
        );

        // Negotiation Strategy
        const negotiationStrategy = generateNegotiationStrategy(
            askingPrice,
            priceEstimate.low,
            priceEstimate.high,
            relData?.knownIssues || [],
            redFlags,
            mileage,
            vehicle.year
        );

        // Maintenance Cost Projection
        const maintenanceCosts = calculateMaintenanceCosts(
            vehicle.make,
            vehicle.model,
            vehicle.year,
            mileage,
            relData?.knownIssues || []
        );

        // Inspection Checklist
        const inspectionChecklist = generateInspectionChecklist(
            vehicle.make,
            vehicle.model,
            vehicle.year,
            relData?.knownIssues || [],
            redFlags
        );

        // Warranty Value (detect from listing if provided)
        const warrantyInfo: WarrantyInfo = listingText
            ? detectWarrantyFromListing(listingText)
            : { type: 'unknown' };
        const warrantyValue = calculateWarrantyValue(warrantyInfo, vehicle.make);

        // Price Thresholds
        const priceThresholds = calculatePriceThresholds(
            askingPrice,
            priceEstimate.low,
            priceEstimate.high,
            reliabilityScore,
            longevityResult.score,
            safetyScoreResult.score,
            redFlags,
            overallResult.recommendation
        );

        // Aggregate complaints by component for detailed display
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

        // Calculate Maintenance Projections (detailed mileage-based)
        const maintenanceCost = calculateMaintenanceProjections(
            vehicle.make,
            vehicle.model,
            vehicle.year,
            mileage
        );

        // Response
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
            safety: {
                score: safetyScoreResult.score,
                breakdown: safetyScoreResult.breakdown,
                confidence: safetyScoreResult.confidence,
                hasCrashTestData: safetyScoreResult.hasCrashTestData,
            },
            knownIssues,
            componentIssues,
            maintenanceCost,
            reliabilityBreakdown: reliabilityResult.breakdown,
            reliabilityAnalysis: {
                baseScore: reliabilityBaseScore,
                yearAdjustment: reliabilityYearAdjustment,
                isYearToAvoid,
                inDatabase: !!relData,
            },
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
            },
            // New features
            sellerRisk,
            negotiationStrategy,
            maintenanceCosts,
            inspectionChecklist,
            warrantyValue,
            priceThresholds
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

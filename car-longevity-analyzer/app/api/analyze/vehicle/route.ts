import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { getRecalls, getComplaints, getSafetyRatings } from '@/lib/nhtsa';
import { calculateDynamicReliability } from '@/lib/dynamic-reliability';
import {
    type RedFlag,
    generateQuestionsForSeller
} from '@/lib/red-flags';
import { calculateSafetyScore, detectSafetyRedFlags } from '@/lib/safety-scoring';
import { getReliabilityData } from '@/lib/reliability-data';
import { LIFESPAN_ADJUSTMENT_LIMITS, UNAUTH_VEHICLE_SEARCH_RATE_LIMIT } from '@/lib/constants';
import { calculateYearSpecificLifespan } from '@/lib/year-lifespan-adjuster';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { extractKnownIssues } from '@/lib/complaint-analyzer';

const AnalyzeVehicleSchema = z.object({
    year: z.number().int().min(1981).max(new Date().getFullYear() + 1),
    make: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
});

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            // Unauthenticated: rate limit (5/day per IP)
            const ip = getClientIdentifier(request);
            const rateLimit = checkRateLimit(
                `unauth:vehicle:${ip}`,
                UNAUTH_VEHICLE_SEARCH_RATE_LIMIT.maxRequests,
                UNAUTH_VEHICLE_SEARCH_RATE_LIMIT.windowMs
            );
            if (!rateLimit.allowed) {
                return NextResponse.json(
                    { success: false, error: 'Daily search limit reached. Sign up for unlimited free searches.' },
                    { status: 429 }
                );
            }
        }
        // Authenticated users: unlimited free vehicle searches (no usage tracking)

        const body = await request.json();

        const result = AnalyzeVehicleSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: "Validation Error", details: result.error.issues },
                { status: 400 }
            );
        }

        const { year, make, model } = result.data;

        // Parallel NHTSA calls
        const [recallsResult, complaintsResult, safetyResult] = await Promise.allSettled([
            getRecalls(make, model, year),
            getComplaints(make, model, year),
            getSafetyRatings(make, model, year)
        ]);

        const recalls = recallsResult.status === 'fulfilled' ? recallsResult.value : [];
        const complaints = complaintsResult.status === 'fulfilled' ? complaintsResult.value : [];
        const safetyRatingData = safetyResult.status === 'fulfilled' ? safetyResult.value : null;

        const relData = getReliabilityData(make, model);
        const baseLifespan = relData ? relData.expectedLifespanMiles : LIFESPAN_ADJUSTMENT_LIMITS.defaultLifespan;

        // Calculate year-specific expected lifespan
        const yearLifespan = await calculateYearSpecificLifespan(make, model, year);

        // Extract known issues from NHTSA complaints
        const knownIssues = extractKnownIssues(complaints);

        // Calculate reliability using dynamic system
        const reliabilityResult = calculateDynamicReliability(
            make,
            model,
            year,
            complaints,
            safetyRatingData
        );
        const reliabilityScore = reliabilityResult.score;

        // Reliability breakdown for transparency
        const reliabilityBaseScore = relData ? relData.baseScore : 5.0;
        const isYearToAvoid = relData?.yearsToAvoid.includes(year) || false;
        let reliabilityYearAdjustment = 0;
        if (isYearToAvoid) {
            reliabilityYearAdjustment = -2.0;
        } else if (year >= 2018) {
            reliabilityYearAdjustment = 0.5;
        }

        // Safety scoring
        const safetyScoreResult = calculateSafetyScore(safetyRatingData, complaints, year);

        // Red flags from safety data only (no listing text, no price)
        const redFlags: RedFlag[] = [];
        const safetyRedFlags = detectSafetyRedFlags(safetyScoreResult, complaints);
        redFlags.push(...safetyRedFlags.map(f => ({
            ...f,
            advice: f.advice || 'Review this safety concern carefully before purchasing.'
        })));

        // Questions for seller
        const questions = generateQuestionsForSeller(
            { make, model, year },
            redFlags,
            recalls
        );

        // Aggregate complaints by component
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

            if (existing.summaries.length < 3 && complaint.Summary) {
                existing.summaries.push(complaint.Summary.slice(0, 200));
            }

            componentMap.set(component, existing);
        }

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
            .slice(0, 10);

        return NextResponse.json({
            success: true,
            analysisType: 'vehicle',
            vehicle: {
                year,
                make,
                model,
            },
            scores: {
                reliability: reliabilityScore,
                longevity: null,
                priceValue: null,
                safety: safetyScoreResult.score,
                overall: null, // No overall score without price/mileage
            },
            expectedLifespan: {
                miles: yearLifespan.expectedLifespanMiles,
                years: yearLifespan.expectedLifespanYears,
                baseLifespanMiles: yearLifespan.baseLifespanMiles,
                yearMultiplier: yearLifespan.yearMultiplier,
                adjustments: yearLifespan.adjustments,
                confidence: yearLifespan.confidence,
                source: yearLifespan.source,
            },
            longevity: null, // Requires mileage
            lifespanAnalysis: null, // No adjustment factors available without VIN
            reliabilityAnalysis: {
                baseScore: reliabilityBaseScore,
                yearAdjustment: reliabilityYearAdjustment,
                isYearToAvoid,
                inDatabase: !!relData,
            },
            pricing: null, // Requires mileage and price
            safety: {
                score: safetyScoreResult.score,
                breakdown: safetyScoreResult.breakdown,
                confidence: safetyScoreResult.confidence,
                hasCrashTestData: safetyScoreResult.hasCrashTestData,
            },
            knownIssues,
            componentIssues,
            reliabilityBreakdown: reliabilityResult.factors,
            recalls: recalls.map(r => ({ component: r.Component, summary: r.Summary, date: r.ReportReceivedDate })).slice(0, 5),
            safetyRating: safetyRatingData ? {
                overallRating: safetyRatingData.OverallRating,
                frontalCrashRating: safetyRatingData.FrontalCrashRating,
                sideCrashRating: safetyRatingData.SideCrashRating,
                rolloverRating: safetyRatingData.RolloverRating,
                frontCrashDriversideRating: safetyRatingData.FrontCrashDriversideRating,
                frontCrashPassengersideRating: safetyRatingData.FrontCrashPassengersideRating,
                sideCrashDriversideRating: safetyRatingData.SideCrashDriversideRating,
                sideCrashPassengersideRating: safetyRatingData.SideCrashPassengersideRating,
                complaintsCount: safetyRatingData.ComplaintsCount,
                recallsCount: safetyRatingData.RecallsCount,
            } : null,
            redFlags,
            recommendation: {
                verdict: reliabilityScore >= 6.5 ? 'BUY' as const :
                         reliabilityScore >= 4.0 ? 'MAYBE' as const : 'PASS' as const,
                confidence: reliabilityResult.confidence === 'high' ? 0.8 :
                            reliabilityResult.confidence === 'medium' ? 0.5 : 0.3,
                summary: generateVehicleSummary(make, model, year, reliabilityScore, isYearToAvoid, knownIssues.length, recalls.length),
                questionsForSeller: questions,
            },
        });

    } catch (error) {
        console.error("Vehicle Analysis Error:", error);

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

function generateVehicleSummary(
    make: string,
    model: string,
    year: number,
    reliabilityScore: number,
    isYearToAvoid: boolean,
    knownIssueCount: number,
    recallCount: number
): string {
    const parts: string[] = [];

    if (reliabilityScore >= 8) {
        parts.push(`The ${year} ${make} ${model} is highly reliable.`);
    } else if (reliabilityScore >= 6.5) {
        parts.push(`The ${year} ${make} ${model} has good reliability.`);
    } else if (reliabilityScore >= 4) {
        parts.push(`The ${year} ${make} ${model} has average reliability.`);
    } else {
        parts.push(`The ${year} ${make} ${model} has below-average reliability.`);
    }

    if (isYearToAvoid) {
        parts.push(`${year} is a known problematic year for this model.`);
    }

    if (knownIssueCount > 0) {
        parts.push(`${knownIssueCount} known issue${knownIssueCount > 1 ? 's' : ''} reported.`);
    }

    if (recallCount > 0) {
        parts.push(`${recallCount} recall${recallCount > 1 ? 's' : ''} on record.`);
    }

    parts.push('For a complete analysis with pricing and lifespan projections, try a VIN lookup.');

    return parts.join(' ');
}

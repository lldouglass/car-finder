import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { checkAndIncrementUsage } from '@/lib/usage';
import { analyzeListingWithAI } from '@/lib/ai-analyzer';
import { getComplaints, getSafetyRatings } from '@/lib/nhtsa';
import {
    calculateReliabilityScore,
    calculateLongevityScore,
    calculatePriceScore,
    calculateOverallScore,
    calculatePriceThresholds
} from '@/lib/scoring';
import {
    type RedFlag,
    detectRedFlags,
    detectPriceAnomaly,
    generateQuestionsForSeller
} from '@/lib/red-flags';
import { calculateSafetyScore, detectSafetyRedFlags } from '@/lib/safety-scoring';
import { getReliabilityData } from '@/lib/reliability-data';
import { estimateFairPriceWithApi, isPricingApiConfigured } from '@/lib/pricing-api';
import { INPUT_LIMITS, VEHICLE_CONSTANTS, LIFESPAN_ADJUSTMENT_LIMITS } from '@/lib/constants';
import {
    calculateAdjustedLifespan,
    ownerCountToHistory,
    type LifespanFactors,
    type MaintenanceQuality,
    type DrivingConditions,
    type AccidentSeverity,
} from '@/lib/lifespan-factors';
import { mergeLifespanFactors } from '@/lib/vin-factor-mapper';
import { getClimateRegion } from '@/lib/region-mapper';
import { generateNegotiationStrategy } from '@/lib/negotiation-advisor';
import { calculateMaintenanceCosts } from '@/lib/maintenance-costs';
import { generateInspectionChecklist } from '@/lib/inspection-checklist';
import { calculateWarrantyValue, detectWarrantyFromListing, type WarrantyInfo } from '@/lib/warranty-value';
import { extractKnownIssues } from '@/lib/complaint-analyzer';
import { calculateSurvivalProbabilities, type SurvivalAnalysis } from '@/lib/survival-model';

// Seller type enum for validation
const SellerTypeEnum = z.enum(['cpo', 'franchise_same', 'franchise_other', 'independent_lot', 'private', 'auction', 'unknown']);

const AnalyzeListingSchema = z.object({
    listingText: z.string()
        .min(10, "Listing text is too short")
        .max(INPUT_LIMITS.maxListingLength, "Listing text exceeds maximum length"),
    askingPrice: z.number().nonnegative().max(INPUT_LIMITS.maxPrice).optional(),
    mileage: z.number().nonnegative().max(INPUT_LIMITS.maxMileage).optional(),
    location: z.string().max(100).optional(), // State code or name for climate region
    sellerType: SellerTypeEnum.optional(),
});

// Helper to map AI usage pattern to DrivingConditions type
function mapUsagePatternToConditions(pattern: string | null): DrivingConditions {
    if (!pattern) return 'unknown';
    const mapping: Record<string, DrivingConditions> = {
        highway: 'highway_primary',
        city: 'city_primary',
        mixed: 'mixed',
        severe: 'severe',
    };
    return mapping[pattern] || 'unknown';
}

// Helper to map AI accident history to AccidentSeverity type
function mapAccidentToSeverity(history: { hasAccident: boolean; severity?: string }): AccidentSeverity {
    if (!history.hasAccident) return 'none';
    if (history.severity) {
        const mapping: Record<string, AccidentSeverity> = {
            minor: 'minor',
            moderate: 'moderate',
            severe: 'severe',
        };
        return mapping[history.severity] || 'unknown';
    }
    return 'unknown';
}

// Helper to generate targeted questions for different inconsistency types
function generateInconsistencyQuestion(type: string): string {
    const questions: Record<string, string> = {
        mileage_age: 'Can you explain how the vehicle has such low/high mileage for its age?',
        price_condition: 'Why is the price significantly different from similar vehicles in this condition?',
        usage_wear: 'Can you clarify the driving conditions the vehicle was primarily used in?',
        owner_age: 'Can you provide documentation of ownership history?',
        description_conflict: 'Some details in the listing seem inconsistent - can you clarify?'
    };
    return questions[type] || 'Can you provide more details about the vehicle history?';
}

export async function POST(request: Request) {
    try {
        // Auth check
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Usage check
        const usage = await checkAndIncrementUsage(userId);
        if (!usage.allowed) {
            return NextResponse.json({
                success: false,
                error: 'Free limit reached',
                upgrade: true,
                message: `You have used all ${usage.limit} free analyses this month. Upgrade to Premium for unlimited access.`,
                usage: {
                    used: usage.used,
                    limit: usage.limit,
                    remaining: usage.remaining,
                },
            }, { status: 403 });
        }

        const body = await request.json();

        // 1. Validate Input
        const result = AnalyzeListingSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: "Validation Error", details: result.error.issues },
                { status: 400 }
            );
        }

        const { listingText, location, sellerType } = result.data;
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

        // 3. Extract lifespan factors from AI analysis
        const aiLifespanFactors = aiResult.lifespanFactors;

        // Convert AI-extracted data to lifespan factor types
        const aiFactors: Partial<LifespanFactors> = {
            maintenance: aiLifespanFactors.maintenanceQuality as MaintenanceQuality | undefined,
            drivingConditions: mapUsagePatternToConditions(aiLifespanFactors.usagePattern),
            accidentHistory: mapAccidentToSeverity(aiLifespanFactors.accidentHistory),
            ownerCount: ownerCountToHistory(aiLifespanFactors.ownerCount),
        };

        // Get climate region from location
        const climateRegion = getClimateRegion(location);

        // Merge with empty VIN factors (no VIN decode for listing analysis)
        const lifespanFactors: LifespanFactors = mergeLifespanFactors({}, aiFactors, climateRegion);

        // 4. Fetch safety data if we have vehicle info (parallel)
        let complaints: Awaited<ReturnType<typeof getComplaints>> = [];
        let safetyRatings: Awaited<ReturnType<typeof getSafetyRatings>> = null;

        if (extracted?.make && extracted?.model && extracted?.year) {
            const [complaintsResult, safetyRatingsResult] = await Promise.allSettled([
                getComplaints(make, model, year),
                getSafetyRatings(make, model, year)
            ]);

            complaints = complaintsResult.status === 'fulfilled' ? complaintsResult.value : [];
            safetyRatings = safetyRatingsResult.status === 'fulfilled' ? safetyRatingsResult.value : null;
        }

        // 5. Scores Calculation (if sufficient data)
        let reliabilityScore = 0;
        let longevityResult: ReturnType<typeof calculateLongevityScore> | null = null;
        let priceResult: ReturnType<typeof calculatePriceScore> | null = null;
        let overallResult: ReturnType<typeof calculateOverallScore> | null = null;
        let priceEstimate: { low: number; high: number } | null = null;
        let lifespanAnalysis: ReturnType<typeof calculateAdjustedLifespan> | null = null;
        let safetyResult: ReturnType<typeof calculateSafetyScore> | null = null;
        let survivalAnalysis: SurvivalAnalysis | null = null;

        // Reliability
        if (extracted?.make && extracted?.model) {
            reliabilityScore = calculateReliabilityScore(make, model, year, []);
        }

        // Safety (calculate if we have vehicle info)
        if (extracted?.make && extracted?.model && extracted?.year) {
            safetyResult = calculateSafetyScore(safetyRatings, complaints, year);
        }

        // Extract known issues from NHTSA complaints (for lifespan adjustment)
        const knownIssues = extractKnownIssues(complaints);

        // Longevity with adjusted lifespan
        if (mileage !== undefined) {
            const relDataForLifespan = getReliabilityData(make, model);
            const baseLifespan = relDataForLifespan ? relDataForLifespan.expectedLifespanMiles : LIFESPAN_ADJUSTMENT_LIMITS.defaultLifespan;

            // Also get curated known issues from reliability database (e.g., Theta II engine)
            // and filter to those affecting this model year
            const curatedIssues = (relDataForLifespan?.knownIssues || [])
                .filter(issue => !issue.affectedYears || issue.affectedYears.includes(year))
                .map(issue => ({
                    severity: issue.severity.toUpperCase() as 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL',
                    component: issue.component,
                }));

            // Combine both sources of known issues for lifespan calculation
            const allKnownIssuesForLifespan = [
                ...knownIssues.map(i => ({ severity: i.severity, component: i.component })),
                ...curatedIssues,
            ];

            // Calculate adjusted lifespan based on factors and known issues
            lifespanAnalysis = calculateAdjustedLifespan(baseLifespan, lifespanFactors, allKnownIssuesForLifespan);
            const expectedLifespan = lifespanAnalysis.adjustedLifespan;

            longevityResult = calculateLongevityScore(expectedLifespan, mileage);

            // Calculate survival probabilities using Weibull distribution
            const currentYear = new Date().getFullYear();
            const vehicleAge = currentYear - year;
            survivalAnalysis = calculateSurvivalProbabilities({
                currentMileage: mileage,
                vehicleAge,
                adjustedLifespan: lifespanAnalysis.adjustedLifespan,
                baseReliabilityScore: reliabilityScore || 5.0,  // Default if reliability not calculated
                knownIssues: allKnownIssuesForLifespan,
                factors: lifespanFactors,
                lifespanConfidence: lifespanAnalysis.confidence,
            });
        }

        // Price
        let priceSource: 'api' | 'formula' | null = null;
        let priceConfidence: string | null = null;
        let priceSampleSize: number | null = null;
        if (askingPrice !== undefined && mileage !== undefined && extracted?.make) {
            const priceEstimateResult = await estimateFairPriceWithApi(make, model, year, mileage);
            priceEstimate = { low: priceEstimateResult.low, high: priceEstimateResult.high };
            priceSource = priceEstimateResult.source;
            priceConfidence = priceEstimateResult.confidence || null;
            priceSampleSize = priceEstimateResult.sampleSize || null;
            priceResult = calculatePriceScore(askingPrice, priceEstimate.low, priceEstimate.high);
        }

        // 6. Red Flags
        const regexRedFlags = detectRedFlags(listingText);

        // Convert AI concerns to red flags
        const aiConcernFlags = aiResult.concerns.map(c => ({
            type: 'ai_concern',
            severity: c.severity,
            message: c.issue,
            advice: c.explanation
        }));

        // Convert AI inconsistencies to red flags (these are particularly important)
        const inconsistencyFlags = aiResult.inconsistencies.map(inc => ({
            type: `inconsistency_${inc.type}`,
            severity: inc.severity,
            message: `Inconsistency: ${inc.description}`,
            advice: inc.details,
            questionToAsk: generateInconsistencyQuestion(inc.type)
        }));

        // Convert suspicious patterns to red flags
        const suspiciousFlags = aiResult.suspiciousPatterns.map(sp => ({
            type: `suspicious_${sp.type}`,
            severity: sp.severity,
            message: `Suspicious language: "${sp.phrase}"`,
            advice: sp.explanation
        }));

        let allRedFlags: RedFlag[] = [...regexRedFlags, ...aiConcernFlags, ...inconsistencyFlags, ...suspiciousFlags];

        // Price anomaly check
        if (priceResult && askingPrice !== undefined && priceEstimate) {
            const priceFlag = detectPriceAnomaly(askingPrice, priceEstimate.low, priceEstimate.high);
            if (priceFlag) allRedFlags.push(priceFlag);
        }

        // Safety red flags
        if (safetyResult) {
            const safetyRedFlags = detectSafetyRedFlags(safetyResult, complaints);
            // Map SafetyRedFlag to RedFlag (provide default advice if missing)
            allRedFlags.push(...safetyRedFlags.map(f => ({
                ...f,
                advice: f.advice || 'Review this safety concern carefully before purchasing.'
            })));
        }

        // Overall Score (now includes safety when available)
        if (reliabilityScore > 0 && longevityResult && priceResult) {
            overallResult = calculateOverallScore(
                reliabilityScore,
                longevityResult.score,
                priceResult.score,
                allRedFlags,
                safetyResult?.score ?? null
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

        // New feature calculations
        const relData = getReliabilityData(make, model);

        // Negotiation Strategy (only if we have price data)
        const negotiationStrategy = (askingPrice !== undefined && priceEstimate && mileage !== undefined)
            ? generateNegotiationStrategy(
                askingPrice,
                priceEstimate.low,
                priceEstimate.high,
                relData?.knownIssues || [],
                allRedFlags,
                mileage,
                year
            )
            : null;

        // Maintenance Cost Projection (only if we have mileage)
        const maintenanceCosts = (mileage !== undefined)
            ? calculateMaintenanceCosts(
                make,
                model,
                year,
                mileage,
                relData?.knownIssues || []
            )
            : null;

        // Inspection Checklist
        const inspectionChecklist = generateInspectionChecklist(
            make,
            model,
            year,
            relData?.knownIssues || [],
            allRedFlags
        );

        // Warranty Value (detect from listing)
        const warrantyInfo: WarrantyInfo = detectWarrantyFromListing(listingText);
        const warrantyValue = calculateWarrantyValue(warrantyInfo, make);

        // Price Thresholds (only if we have all required data)
        const priceThresholds = (
            askingPrice !== undefined &&
            priceEstimate &&
            reliabilityScore > 0 &&
            longevityResult &&
            overallResult
        )
            ? calculatePriceThresholds(
                askingPrice,
                priceEstimate.low,
                priceEstimate.high,
                reliabilityScore,
                longevityResult.score,
                safetyResult?.score ?? null,
                allRedFlags,
                overallResult.recommendation
            )
            : null;

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
                safety: safetyResult?.score || null,
                overall: overallResult?.score || null
            },
            longevity: longevityResult ? {
                expectedLifespan: lifespanAnalysis?.adjustedLifespan,
                baseLifespan: lifespanAnalysis?.baseLifespan,
                estimatedRemainingMiles: longevityResult.remainingMiles,
                remainingYears: longevityResult.remainingYears,
                percentUsed: longevityResult.percentUsed
            } : null,
            lifespanAnalysis: lifespanAnalysis ? {
                baseLifespan: lifespanAnalysis.baseLifespan,
                adjustedLifespan: lifespanAnalysis.adjustedLifespan,
                totalMultiplier: lifespanAnalysis.totalMultiplier,
                appliedFactors: lifespanAnalysis.appliedFactors,
                confidence: lifespanAnalysis.confidence,
            } : null,
            pricing: priceResult ? {
                askingPrice,
                fairPriceLow: priceEstimate?.low,
                fairPriceHigh: priceEstimate?.high,
                dealQuality: priceResult.dealQuality,
                analysis: priceResult.analysis,
                source: priceSource,
                confidence: priceConfidence,
                sampleSize: priceSampleSize,
            } : null,
            safety: safetyResult ? {
                score: safetyResult.score,
                breakdown: safetyResult.breakdown,
                confidence: safetyResult.confidence,
                hasCrashTestData: safetyResult.hasCrashTestData,
            } : null,
            safetyRating: safetyRatings ? {
                overallRating: safetyRatings.OverallRating,
                frontalCrashRating: safetyRatings.FrontalCrashRating,
                sideCrashRating: safetyRatings.SideCrashRating,
                rolloverRating: safetyRatings.RolloverRating,
                frontCrashDriversideRating: safetyRatings.FrontCrashDriversideRating,
                frontCrashPassengersideRating: safetyRatings.FrontCrashPassengersideRating,
                sideCrashDriversideRating: safetyRatings.SideCrashDriversideRating,
                sideCrashPassengersideRating: safetyRatings.SideCrashPassengersideRating,
                complaintsCount: safetyRatings.ComplaintsCount,
                recallsCount: safetyRatings.RecallsCount,
            } : null,
            aiAnalysis: {
                trustworthiness: aiResult.trustworthinessScore,
                impression: aiResult.overallImpression,
                concerns: aiResult.concerns,
                inconsistencies: aiResult.inconsistencies,
                suspiciousPatterns: aiResult.suspiciousPatterns,
                extractedLifespanFactors: aiResult.lifespanFactors,
            },
            redFlags: allRedFlags,
            knownIssues,
            recommendation: {
                verdict: overallResult?.recommendation || 'MAYBE', // Default if incomplete
                confidence: overallResult?.confidence || 0.5,
                summary: overallResult?.summary || aiResult.overallImpression,
                questionsForSeller: allQuestions
            },
            // New features
            negotiationStrategy,
            maintenanceCosts,
            inspectionChecklist,
            warrantyValue,
            priceThresholds,
            survivalAnalysis,
        });

    } catch (error) {
        // Log detailed error info for debugging
        console.error("[Listing Analysis] Error:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });

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

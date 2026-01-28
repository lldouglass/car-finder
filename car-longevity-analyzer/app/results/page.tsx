'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAnalysis } from '@/lib/analysis-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { ResultsSkeleton } from '@/components/results-skeleton';
import {
  NoRecallsFound,
  NoRedFlags,
  NoPriceData,
  NoLongevityData,
  NoQuestionsGenerated,
  AIAnalysisUnavailable,
  VehicleNotIdentified,
} from '@/components/empty-states';
import { SafetyRatingsDisplay, NoSafetyRatings } from '@/components/safety-ratings-display';
import { KnownIssuesDisplay } from '@/components/known-issues-display';
import { LifespanFactorsDisplay } from '@/components/lifespan-factors-display';
import {
  Car,
  ArrowLeft,
  Gauge,
  Shield,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  MessageCircle,
  AlertCircle,
  Info,
  Wrench,
  Activity,
  Store,
  TrendingDown,
  Clipboard,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { RedFlag } from '@/lib/api';

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString();
}

function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return `$${num.toLocaleString()}`;
}

function ScoreDisplay({ score, label, description }: { score: number | null; label: string; description?: string }) {
  const scoreValue = score?.toFixed(1) ?? '--';
  const getColor = (s: number) => {
    if (s >= 7) return 'text-green-600 dark:text-green-400';
    if (s >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div
      className="text-center"
      role="meter"
      aria-valuenow={score ?? undefined}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-label={`${label} score: ${scoreValue} out of 10`}
    >
      <div className={`text-3xl font-bold ${score !== null ? getColor(score) : 'text-muted-foreground'}`}>
        {scoreValue}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {description && <div className="sr-only">{description}</div>}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const variants: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
    BUY: {
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: <CheckCircle className="size-4" aria-hidden="true" />,
      label: 'Recommended to buy',
    },
    MAYBE: {
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <HelpCircle className="size-4" aria-hidden="true" />,
      label: 'Consider with caution',
    },
    PASS: {
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: <XCircle className="size-4" aria-hidden="true" />,
      label: 'Not recommended',
    },
  };

  const v = variants[verdict] || variants.MAYBE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold ${v.className}`}
      role="status"
      aria-label={v.label}
    >
      {v.icon}
      {verdict}
    </span>
  );
}

function DealQualityBadge({ quality }: { quality: string }) {
  const colors: Record<string, string> = {
    GREAT: 'bg-green-500',
    GOOD: 'bg-green-400',
    FAIR: 'bg-yellow-500',
    HIGH: 'bg-orange-500',
    OVERPRICED: 'bg-red-500',
  };

  const labels: Record<string, string> = {
    GREAT: 'Great deal - below market value',
    GOOD: 'Good deal - competitive price',
    FAIR: 'Fair price - within market range',
    HIGH: 'High price - above market average',
    OVERPRICED: 'Overpriced - significantly above market',
  };

  return (
    <Badge
      className={`${colors[quality] || 'bg-gray-500'} text-white`}
      aria-label={labels[quality] || quality}
    >
      {quality}
    </Badge>
  );
}

function RedFlagItem({ flag }: { flag: RedFlag }) {
  const severityColors: Record<string, string> = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-950',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  };

  const severityIcons: Record<string, React.ReactNode> = {
    critical: <AlertCircle className="size-4 text-red-500" aria-hidden="true" />,
    high: <AlertTriangle className="size-4 text-orange-500" aria-hidden="true" />,
    medium: <AlertTriangle className="size-4 text-yellow-500" aria-hidden="true" />,
    low: <Info className="size-4 text-blue-500" aria-hidden="true" />,
  };

  const severity = flag.severity?.toLowerCase() || 'medium';

  return (
    <div
      className={`border-l-4 p-3 rounded-r ${severityColors[severity] || severityColors.medium}`}
      role="listitem"
      aria-label={`${severity} severity: ${flag.message}`}
    >
      <div className="flex items-center gap-2">
        {severityIcons[severity] || severityIcons.medium}
        <span className="font-medium text-sm">{flag.message}</span>
      </div>
      {flag.advice && (
        <p className="text-xs text-muted-foreground mt-1 ml-6">{flag.advice}</p>
      )}
    </div>
  );
}

function ResultsContent() {
  const router = useRouter();
  const { result, isLoading } = useAnalysis();

  useEffect(() => {
    if (!result && !isLoading) {
      router.push('/');
    }
  }, [result, isLoading, router]);

  if (isLoading) {
    return <ResultsSkeleton />;
  }

  if (!result) {
    return <ResultsSkeleton />;
  }

  const {
    vehicle,
    scores,
    longevity,
    pricing,
    redFlags,
    recalls,
    recommendation,
    aiAnalysis,
    safetyRating,
    knownIssues,
    lifespanAnalysis,
    // New features
    sellerRisk,
    negotiationStrategy,
    maintenanceCosts,
    inspectionChecklist,
    warrantyValue,
    priceThresholds
  } = result;

  const hasVehicleInfo = vehicle?.make || vehicle?.model || vehicle?.year;
  const hasLongevityData = longevity && longevity.estimatedRemainingMiles !== undefined;
  const hasPricingData = pricing && pricing.askingPrice !== undefined;
  const hasRedFlags = redFlags && redFlags.length > 0;
  const hasRecalls = recalls && recalls.length > 0;
  const hasQuestions = recommendation?.questionsForSeller && recommendation.questionsForSeller.length > 0;
  const hasAIAnalysis = aiAnalysis && !aiAnalysis.concerns?.some(c => c.issue === 'AI Analysis Unavailable');
  const hasKnownIssues = knownIssues && knownIssues.length > 0;
  const hasLifespanAnalysis = lifespanAnalysis && lifespanAnalysis.appliedFactors;
  // New feature flags
  const hasSellerRisk = sellerRisk && sellerRisk.sellerType !== 'unknown';
  const hasNegotiationStrategy = negotiationStrategy && negotiationStrategy.points.length > 0;
  const hasMaintenanceCosts = maintenanceCosts !== null && maintenanceCosts !== undefined;
  const hasInspectionChecklist = inspectionChecklist !== null && inspectionChecklist !== undefined;
  const hasWarrantyValue = warrantyValue && warrantyValue.coverageQuality !== 'none';
  const hasPriceThresholds = priceThresholds !== null && priceThresholds !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>

        {/* Header */}
        <nav className="flex items-center justify-between mb-6" aria-label="Results navigation">
          <Link href="/">
            <Button variant="ghost" size="sm" aria-label="Go back and analyze a new vehicle">
              <ArrowLeft className="size-4 mr-2" aria-hidden="true" />
              New Analysis
            </Button>
          </Link>
        </nav>

        <main id="main-content" role="main" aria-label="Vehicle analysis results">
          {/* Vehicle Info */}
          <Card className="mb-6" role="region" aria-labelledby="vehicle-title">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3" aria-hidden="true">
                  <Car className="size-6 text-primary" />
                </div>
                <div>
                  {hasVehicleInfo ? (
                    <CardTitle id="vehicle-title" className="text-2xl">
                      {vehicle?.year || 'Unknown Year'} {vehicle?.make || 'Unknown Make'} {vehicle?.model || 'Unknown Model'}
                      {vehicle?.trim && <span className="text-muted-foreground font-normal"> {vehicle.trim}</span>}
                    </CardTitle>
                  ) : (
                    <CardTitle id="vehicle-title" className="text-2xl text-muted-foreground">
                      Vehicle Details Unavailable
                    </CardTitle>
                  )}
                  {recommendation && (
                    <div className="mt-2">
                      <VerdictBadge verdict={recommendation.verdict} />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            {recommendation?.summary ? (
              <CardContent>
                <p className="text-muted-foreground">{recommendation.summary}</p>
              </CardContent>
            ) : !hasVehicleInfo ? (
              <CardContent>
                <VehicleNotIdentified />
              </CardContent>
            ) : null}
          </Card>

          {/* Scores Grid */}
          <section aria-labelledby="scores-heading" className="mb-6">
            <h2 id="scores-heading" className="sr-only">Vehicle Scores</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list">
              <Card role="listitem">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2" aria-hidden="true">
                    <Target className="size-5 text-muted-foreground" />
                  </div>
                  <ScoreDisplay
                    score={scores?.overall ?? null}
                    label="Overall"
                    description="Combined score based on reliability, longevity, and value"
                  />
                </CardContent>
              </Card>
              <Card role="listitem">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2" aria-hidden="true">
                    <Shield className="size-5 text-muted-foreground" />
                  </div>
                  <ScoreDisplay
                    score={scores?.reliability ?? null}
                    label="Reliability"
                    description="Based on historical data for this make and model"
                  />
                </CardContent>
              </Card>
              <Card role="listitem">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2" aria-hidden="true">
                    <Clock className="size-5 text-muted-foreground" />
                  </div>
                  <ScoreDisplay
                    score={scores?.longevity ?? null}
                    label="Longevity"
                    description="Estimated remaining useful life"
                  />
                </CardContent>
              </Card>
              <Card role="listitem">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2" aria-hidden="true">
                    <DollarSign className="size-5 text-muted-foreground" />
                  </div>
                  <ScoreDisplay
                    score={scores?.priceValue ?? null}
                    label="Value"
                    description="Price compared to fair market value"
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Longevity Details */}
            <Card role="region" aria-labelledby="longevity-heading">
              <CardHeader>
                <CardTitle id="longevity-heading" className="text-lg flex items-center gap-2">
                  <Gauge className="size-5" aria-hidden="true" />
                  Longevity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasLongevityData ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Lifespan</span>
                      <span className="font-medium">
                        {formatNumber(
                          longevity.percentUsed < 100
                            ? Math.round(longevity.estimatedRemainingMiles / ((100 - longevity.percentUsed) / 100))
                            : longevity.estimatedRemainingMiles
                        )} miles
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining Miles</span>
                      <span className="font-medium text-lg text-green-600 dark:text-green-400">
                        {formatNumber(longevity.estimatedRemainingMiles)} miles
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining Years</span>
                      <span className="font-medium">{longevity.remainingYears} years</span>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Life Used</span>
                        <span className="font-medium">{longevity.percentUsed}%</span>
                      </div>
                      <div
                        className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2"
                        role="progressbar"
                        aria-valuenow={longevity.percentUsed}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Vehicle life used: ${longevity.percentUsed}%`}
                      >
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, longevity.percentUsed)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <NoLongevityData />
                )}
              </CardContent>
            </Card>

            {/* Pricing Details */}
            <Card role="region" aria-labelledby="pricing-heading">
              <CardHeader>
                <CardTitle id="pricing-heading" className="text-lg flex items-center gap-2">
                  <DollarSign className="size-5" aria-hidden="true" />
                  Price Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasPricingData ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Asking Price</span>
                      <span className="font-medium text-lg">{formatCurrency(pricing.askingPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Fair Price Range</span>
                      <span className="font-medium">
                        {formatCurrency(pricing.fairPriceLow)} - {formatCurrency(pricing.fairPriceHigh)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Deal Quality</span>
                      <DealQualityBadge quality={pricing.dealQuality} />
                    </div>
                    {pricing.analysis && (
                      <p className="text-sm text-muted-foreground">{pricing.analysis}</p>
                    )}
                  </div>
                ) : (
                  <NoPriceData />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Safety Ratings & Known Issues Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Safety Ratings */}
            <Card role="region" aria-labelledby="safety-heading">
              <CardHeader>
                <CardTitle id="safety-heading" className="text-lg flex items-center gap-2">
                  <Shield className="size-5 text-blue-500" aria-hidden="true" />
                  Safety Ratings
                </CardTitle>
                <CardDescription>NHTSA crash test results</CardDescription>
              </CardHeader>
              <CardContent>
                {safetyRating ? (
                  <SafetyRatingsDisplay safetyRating={safetyRating} />
                ) : (
                  <NoSafetyRatings />
                )}
              </CardContent>
            </Card>

            {/* Known Issues */}
            <Card role="region" aria-labelledby="issues-heading">
              <CardHeader>
                <CardTitle id="issues-heading" className="text-lg flex items-center gap-2">
                  <Wrench className="size-5 text-orange-500" aria-hidden="true" />
                  Known Issues {hasKnownIssues && `(${knownIssues.length})`}
                </CardTitle>
                <CardDescription>Common problems from NHTSA complaints</CardDescription>
              </CardHeader>
              <CardContent>
                <KnownIssuesDisplay issues={knownIssues || []} />
              </CardContent>
            </Card>
          </div>

          {/* Lifespan Factors */}
          {hasLifespanAnalysis && (
            <Card className="mb-6" role="region" aria-labelledby="lifespan-factors-heading">
              <CardHeader>
                <CardTitle id="lifespan-factors-heading" className="text-lg flex items-center gap-2">
                  <Activity className="size-5 text-purple-500" aria-hidden="true" />
                  Lifespan Analysis
                </CardTitle>
                <CardDescription>How vehicle factors affect expected lifespan</CardDescription>
              </CardHeader>
              <CardContent>
                <LifespanFactorsDisplay lifespanAnalysis={lifespanAnalysis} />
              </CardContent>
            </Card>
          )}

          {/* Price Impact - show if we have price thresholds */}
          {hasPriceThresholds && priceThresholds.priceImpact && (
            <Card className="mb-6 border-blue-200 dark:border-blue-800" role="region" aria-labelledby="price-impact-heading">
              <CardHeader className="pb-2">
                <CardTitle id="price-impact-heading" className="text-lg flex items-center gap-2">
                  <TrendingDown className="size-5 text-blue-500" aria-hidden="true" />
                  Price Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{priceThresholds.priceImpact}</p>
                {priceThresholds.buyThreshold && priceThresholds.currentVerdict !== 'BUY' && (
                  <p className="text-sm mt-2 font-medium text-green-600 dark:text-green-400">
                    BUY threshold: ${priceThresholds.buyThreshold.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Negotiation Strategy */}
          {hasNegotiationStrategy && negotiationStrategy && (
            <Card className="mb-6" role="region" aria-labelledby="negotiation-heading">
              <CardHeader>
                <CardTitle id="negotiation-heading" className="text-lg flex items-center gap-2">
                  <DollarSign className="size-5 text-green-500" aria-hidden="true" />
                  Negotiation Strategy
                </CardTitle>
                <CardDescription>
                  Overall Leverage:{' '}
                  <span className={
                    negotiationStrategy.overallLeverage === 'strong' ? 'text-green-600 font-medium' :
                    negotiationStrategy.overallLeverage === 'moderate' ? 'text-yellow-600 font-medium' :
                    'text-muted-foreground'
                  }>
                    {negotiationStrategy.overallLeverage.toUpperCase()}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Suggested Offer</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${negotiationStrategy.suggestedOffer.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Walk Away Above</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      ${negotiationStrategy.walkAwayPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                {negotiationStrategy.openingStatement && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs font-medium mb-1">Opening Statement</p>
                    <p className="text-sm italic">"{negotiationStrategy.openingStatement}"</p>
                  </div>
                )}

                <div>
                  <p className="font-medium text-sm mb-2">Talking Points:</p>
                  <ul className="space-y-2">
                    {negotiationStrategy.points.slice(0, 4).map((point, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <Badge className={
                          point.leverage === 'strong' ? 'bg-green-500' :
                          point.leverage === 'moderate' ? 'bg-yellow-500' : 'bg-gray-500'
                        }>
                          {point.leverage}
                        </Badge>
                        <span>{point.point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seller Risk Assessment */}
          {hasSellerRisk && sellerRisk && (
            <Card className="mb-6" role="region" aria-labelledby="seller-risk-heading">
              <CardHeader>
                <CardTitle id="seller-risk-heading" className="text-lg flex items-center gap-2">
                  <Store className="size-5 text-indigo-500" aria-hidden="true" />
                  Seller Risk Assessment
                </CardTitle>
                <CardDescription>
                  Risk Level:{' '}
                  <span className={
                    sellerRisk.riskLevel === 'low' ? 'text-green-600 font-medium' :
                    sellerRisk.riskLevel === 'medium' ? 'text-yellow-600 font-medium' :
                    sellerRisk.riskLevel === 'high' ? 'text-red-600 font-medium' :
                    'text-muted-foreground'
                  }>
                    {sellerRisk.riskLevel.toUpperCase()}
                  </span>
                  {' '}(Score: {sellerRisk.riskScore}/10)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sellerRisk.protections.length > 0 && (
                  <div>
                    <p className="font-medium text-sm text-green-600 dark:text-green-400 mb-1">Buyer Protections:</p>
                    <ul className="text-sm space-y-1">
                      {sellerRisk.protections.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="size-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {sellerRisk.warnings.length > 0 && (
                  <div>
                    <p className="font-medium text-sm text-yellow-600 dark:text-yellow-400 mb-1">Watch Out For:</p>
                    <ul className="text-sm space-y-1">
                      {sellerRisk.warnings.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="size-4 text-yellow-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Maintenance Costs */}
          {hasMaintenanceCosts && maintenanceCosts && (
            <Card className="mb-6" role="region" aria-labelledby="maintenance-heading">
              <CardHeader>
                <CardTitle id="maintenance-heading" className="text-lg flex items-center gap-2">
                  <Wrench className="size-5 text-blue-500" aria-hidden="true" />
                  Maintenance Cost Projection
                </CardTitle>
                <CardDescription>{maintenanceCosts.categoryLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Est. Annual Cost</p>
                    <p className="text-lg font-bold">
                      ${maintenanceCosts.estimatedAnnualCost.low.toLocaleString()} - ${maintenanceCosts.estimatedAnnualCost.high.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">5-Year Projection</p>
                    <p className="text-lg font-bold">
                      ${maintenanceCosts.fiveYearProjection.low.toLocaleString()} - ${maintenanceCosts.fiveYearProjection.high.toLocaleString()}
                    </p>
                  </div>
                </div>

                {maintenanceCosts.upcomingMaintenance.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2">Upcoming Maintenance:</p>
                    <ul className="text-sm space-y-2">
                      {maintenanceCosts.upcomingMaintenance.map((item, i) => (
                        <li key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span className={
                              item.urgency === 'due_now' ? 'text-red-500 font-medium' :
                              item.urgency === 'upcoming' ? 'text-yellow-500' : ''
                            }>
                              {item.item}
                            </span>
                            {item.urgency === 'due_now' && <Badge variant="destructive">Due Now</Badge>}
                          </div>
                          <span className="text-muted-foreground">
                            ${item.estimatedCost.low}-${item.estimatedCost.high}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {maintenanceCosts.costFactors.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {maintenanceCosts.costFactors.join(' | ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Warranty Value */}
          {hasWarrantyValue && warrantyValue && (
            <Card className="mb-6" role="region" aria-labelledby="warranty-heading">
              <CardHeader>
                <CardTitle id="warranty-heading" className="text-lg flex items-center gap-2">
                  <BadgeCheck className="size-5 text-purple-500" aria-hidden="true" />
                  Warranty Value
                </CardTitle>
                <CardDescription>
                  Coverage Quality:{' '}
                  <span className={
                    warrantyValue.coverageQuality === 'excellent' ? 'text-green-600 font-medium' :
                    warrantyValue.coverageQuality === 'good' ? 'text-blue-600 font-medium' :
                    'text-muted-foreground'
                  }>
                    {warrantyValue.coverageQuality.toUpperCase()}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {warrantyValue.estimatedValue.high > 0 && (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Warranty Value</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${warrantyValue.estimatedValue.low.toLocaleString()} - ${warrantyValue.estimatedValue.high.toLocaleString()}
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{warrantyValue.valueExplanation}</p>
                <p className="text-sm">{warrantyValue.recommendation}</p>
                {warrantyValue.warrantyTips.length > 0 && (
                  <ul className="text-sm space-y-1 mt-2">
                    {warrantyValue.warrantyTips.slice(0, 3).map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <Info className="size-4 mt-0.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Inspection Checklist */}
          {hasInspectionChecklist && inspectionChecklist && (
            <Card className="mb-6" role="region" aria-labelledby="inspection-heading">
              <CardHeader>
                <CardTitle id="inspection-heading" className="text-lg flex items-center gap-2">
                  <Clipboard className="size-5 text-teal-500" aria-hidden="true" />
                  Pre-Purchase Inspection Checklist
                </CardTitle>
                <CardDescription>
                  Estimated time: {inspectionChecklist.estimatedInspectionTime}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspectionChecklist.vehicleSpecificItems.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2 text-red-600 dark:text-red-400">
                      Vehicle-Specific Checks ({inspectionChecklist.vehicleSpecificItems.length}):
                    </p>
                    <ul className="text-sm space-y-2">
                      {inspectionChecklist.vehicleSpecificItems.slice(0, 5).map((item, i) => (
                        <li key={i} className="p-2 bg-red-50 dark:bg-red-950 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              item.priority === 'critical' ? 'bg-red-500' :
                              item.priority === 'important' ? 'bg-yellow-500' : 'bg-gray-500'
                            }>
                              {item.priority}
                            </Badge>
                            <span className="font-medium">{item.item}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.whatToLookFor}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="font-medium text-sm mb-2">Documents to Request:</p>
                  <ul className="text-sm grid grid-cols-2 gap-1">
                    {inspectionChecklist.documentsToRequest.map((doc, i) => (
                      <li key={i} className="flex items-center gap-1 text-muted-foreground">
                        <CheckCircle className="size-3" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">Test Drive Checklist:</p>
                  <ul className="text-sm space-y-1">
                    {inspectionChecklist.testDriveChecklist.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Red Flags */}
          <Card className="mb-6" role="region" aria-labelledby="redflags-heading">
            <CardHeader>
              <CardTitle id="redflags-heading" className="text-lg flex items-center gap-2">
                <AlertTriangle className="size-5 text-yellow-500" aria-hidden="true" />
                Red Flags {hasRedFlags && `(${redFlags.length})`}
              </CardTitle>
              <CardDescription>Issues to be aware of before purchasing</CardDescription>
            </CardHeader>
            <CardContent>
              {hasRedFlags ? (
                <div className="space-y-3" role="list" aria-label="List of red flags">
                  {redFlags.map((flag, index) => (
                    <RedFlagItem key={index} flag={flag} />
                  ))}
                </div>
              ) : (
                <NoRedFlags />
              )}
            </CardContent>
          </Card>

          {/* AI Analysis (for listing analysis) */}
          {aiAnalysis && (
            <Card className="mb-6" role="region" aria-labelledby="ai-heading">
              <CardHeader>
                <CardTitle id="ai-heading" className="text-lg flex items-center gap-2">
                  <Info className="size-5" aria-hidden="true" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  Trustworthiness Score: <span aria-label={`${aiAnalysis.trustworthiness} out of 10`}>{aiAnalysis.trustworthiness}/10</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasAIAnalysis ? (
                  <>
                    <p className="text-muted-foreground mb-4">{aiAnalysis.impression}</p>
                    {aiAnalysis.concerns && aiAnalysis.concerns.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-sm">AI Concerns:</p>
                        <div role="list" aria-label="AI identified concerns">
                          {aiAnalysis.concerns.map((concern, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded" role="listitem">
                              <span className="font-medium">{concern.issue}</span>
                              <p className="text-muted-foreground">{concern.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <AIAnalysisUnavailable />
                )}
              </CardContent>
            </Card>
          )}

          {/* Recalls */}
          <Card className="mb-6" role="region" aria-labelledby="recalls-heading">
            <CardHeader>
              <CardTitle id="recalls-heading" className="text-lg flex items-center gap-2">
                <AlertCircle className="size-5 text-red-500" aria-hidden="true" />
                Recalls {hasRecalls && `(${recalls.length})`}
              </CardTitle>
              <CardDescription>Known safety recalls for this vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              {hasRecalls ? (
                <div className="space-y-3" role="list" aria-label="List of safety recalls">
                  {recalls.map((recall, index) => (
                    <Alert key={index} role="listitem">
                      <AlertTriangle className="size-4" aria-hidden="true" />
                      <AlertTitle>{recall.component}</AlertTitle>
                      <AlertDescription>
                        {recall.summary}
                        <span className="text-xs block mt-1 text-muted-foreground">
                          Reported: <time>{recall.date}</time>
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <NoRecallsFound />
              )}
            </CardContent>
          </Card>

          {/* Questions for Seller */}
          <Card className="mb-6" role="region" aria-labelledby="questions-heading">
            <CardHeader>
              <CardTitle id="questions-heading" className="text-lg flex items-center gap-2">
                <MessageCircle className="size-5" aria-hidden="true" />
                Questions to Ask the Seller
              </CardTitle>
              <CardDescription>Important questions based on the analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {hasQuestions ? (
                <ol className="space-y-2" aria-label="Questions to ask the seller">
                  {recommendation.questionsForSeller.map((question, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary font-medium" aria-hidden="true">{index + 1}.</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <NoQuestionsGenerated />
              )}
            </CardContent>
          </Card>

          {/* Back button */}
          <div className="text-center">
            <Link href="/">
              <Button variant="outline" size="lg" aria-label="Analyze another vehicle">
                <ArrowLeft className="size-4 mr-2" aria-hidden="true" />
                Analyze Another Vehicle
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <ErrorBoundary>
      <ResultsContent />
    </ErrorBoundary>
  );
}

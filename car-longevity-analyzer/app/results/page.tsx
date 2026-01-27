'use client';

import React, { useEffect } from 'react';
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
} from 'lucide-react';
import type { RedFlag, ComponentIssue, SafetyResult } from '@/lib/api';
import { VehicleHistoryCard } from '@/components/vehicle-history-card';

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

function StarRating({ rating, label }: { rating: number | null; label: string }) {
  if (rating === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}:</span>
        <span className="text-sm text-muted-foreground">Not Rated</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`size-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-medium">{rating}/5</span>
    </div>
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

function RedFlagItem({ flag, index }: { flag: RedFlag; index: number }) {
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

  const { vehicle, scores, longevity, pricing, redFlags, recalls, recommendation, aiAnalysis, componentIssues, safety } = result;

  const hasVehicleInfo = vehicle?.make || vehicle?.model || vehicle?.year;
  const hasLongevityData = longevity && longevity.estimatedRemainingMiles !== undefined;
  const hasPricingData = pricing && pricing.askingPrice !== undefined;
  const hasRedFlags = redFlags && redFlags.length > 0;
  const hasRecalls = recalls && recalls.length > 0;
  const hasQuestions = recommendation?.questionsForSeller && recommendation.questionsForSeller.length > 0;
  const hasAIAnalysis = aiAnalysis && !aiAnalysis.concerns?.some(c => c.issue === 'AI Analysis Unavailable');
  const hasComponentIssues = componentIssues && componentIssues.length > 0;

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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4" role="list">
              <Card role="listitem">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2" aria-hidden="true">
                    <Target className="size-5 text-muted-foreground" />
                  </div>
                  <ScoreDisplay
                    score={scores?.overall ?? null}
                    label="Overall"
                    description="Combined score based on reliability, longevity, safety, and value"
                  />
                </CardContent>
              </Card>
              <Card role="listitem">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2" aria-hidden="true">
                    <Gauge className="size-5 text-muted-foreground" />
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
                    <Shield className="size-5 text-muted-foreground" />
                  </div>
                  <ScoreDisplay
                    score={scores?.safety ?? null}
                    label="Safety"
                    description="Based on crash test ratings and incident data"
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
                  <Clock className="size-5" aria-hidden="true" />
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

          {/* Safety Details */}
          {safety && (
            <Card className="mb-6" role="region" aria-labelledby="safety-heading">
              <CardHeader>
                <CardTitle id="safety-heading" className="text-lg flex items-center gap-2">
                  <Shield className="size-5" aria-hidden="true" />
                  Safety Details
                </CardTitle>
                <CardDescription>
                  NHTSA crash test ratings and incident data
                  {safety.confidence && (
                    <Badge variant="outline" className="ml-2">
                      {safety.confidence} confidence
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Crash Test Ratings */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      Crash Test Ratings
                      {!safety.hasCrashTestData && (
                        <Badge variant="secondary" className="text-xs">No data</Badge>
                      )}
                    </h4>
                    {safety.hasCrashTestData ? (
                      <div className="space-y-2">
                        <StarRating rating={safety.breakdown.crashTestRatings.overall} label="Overall" />
                        <StarRating rating={safety.breakdown.crashTestRatings.frontal} label="Frontal" />
                        <StarRating rating={safety.breakdown.crashTestRatings.side} label="Side" />
                        <StarRating rating={safety.breakdown.crashTestRatings.rollover} label="Rollover" />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No NHTSA crash test data available for this vehicle.
                        This may be due to the vehicle's age or limited testing.
                      </p>
                    )}
                  </div>

                  {/* Incident Data */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Reported Incidents (NHTSA Complaints)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg ${safety.breakdown.incidents.deaths > 0 ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' : 'bg-muted'}`}>
                        <div className={`text-2xl font-bold ${safety.breakdown.incidents.deaths > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {safety.breakdown.incidents.deaths}
                        </div>
                        <div className="text-xs text-muted-foreground">Fatalities</div>
                      </div>
                      <div className={`p-3 rounded-lg ${safety.breakdown.incidents.injuries > 0 ? 'bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800' : 'bg-muted'}`}>
                        <div className={`text-2xl font-bold ${safety.breakdown.incidents.injuries > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                          {safety.breakdown.incidents.injuries}
                        </div>
                        <div className="text-xs text-muted-foreground">Injuries</div>
                      </div>
                      <div className={`p-3 rounded-lg ${safety.breakdown.incidents.fires > 0 ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800' : 'bg-muted'}`}>
                        <div className={`text-2xl font-bold ${safety.breakdown.incidents.fires > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                          {safety.breakdown.incidents.fires}
                        </div>
                        <div className="text-xs text-muted-foreground">Fires</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold">
                          {safety.breakdown.incidents.crashes}
                        </div>
                        <div className="text-xs text-muted-foreground">Crashes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Component Issues from NHTSA */}
          {hasComponentIssues && (
            <Card className="mb-6" role="region" aria-labelledby="component-issues-heading">
              <CardHeader>
                <CardTitle id="component-issues-heading" className="text-lg flex items-center gap-2">
                  <AlertCircle className="size-5 text-orange-500" aria-hidden="true" />
                  Known Component Issues
                </CardTitle>
                <CardDescription>Common problems reported to NHTSA for this make/model/year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" role="list" aria-label="List of component issues">
                  {componentIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800"
                      role="listitem"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{issue.component}</span>
                          <Badge variant="outline" className="text-xs">
                            {issue.complaintCount} complaints
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Data from NHTSA complaint database. More complaints may indicate common issues to watch for.
                </p>
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
                    <RedFlagItem key={index} flag={flag} index={index} />
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
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{aiAnalysis.impression}</p>

                    {/* Inconsistencies - most important for lie detection */}
                    {aiAnalysis.inconsistencies && aiAnalysis.inconsistencies.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-sm flex items-center gap-2">
                          <AlertTriangle className="size-4 text-orange-500" aria-hidden="true" />
                          Inconsistencies Detected
                        </p>
                        <div role="list" aria-label="Detected inconsistencies" className="space-y-2">
                          {aiAnalysis.inconsistencies.map((inc, index) => (
                            <div
                              key={index}
                              className={`text-sm p-3 rounded border-l-4 ${
                                inc.severity === 'high' ? 'bg-red-50 dark:bg-red-950 border-red-500' :
                                inc.severity === 'medium' ? 'bg-orange-50 dark:bg-orange-950 border-orange-500' :
                                'bg-yellow-50 dark:bg-yellow-950 border-yellow-500'
                              }`}
                              role="listitem"
                            >
                              <span className="font-medium">{inc.description}</span>
                              <p className="text-muted-foreground text-xs mt-1">{inc.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suspicious Patterns */}
                    {aiAnalysis.suspiciousPatterns && aiAnalysis.suspiciousPatterns.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-sm flex items-center gap-2">
                          <AlertCircle className="size-4 text-yellow-500" aria-hidden="true" />
                          Suspicious Language Detected
                        </p>
                        <div role="list" aria-label="Suspicious patterns" className="space-y-2">
                          {aiAnalysis.suspiciousPatterns.map((pattern, index) => (
                            <div
                              key={index}
                              className="text-sm p-3 bg-yellow-50 dark:bg-yellow-950 rounded border-l-4 border-yellow-400"
                              role="listitem"
                            >
                              <span className="font-medium italic">"{pattern.phrase}"</span>
                              <p className="text-muted-foreground text-xs mt-1">{pattern.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* General Concerns */}
                    {aiAnalysis.concerns && aiAnalysis.concerns.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-sm">Other Concerns:</p>
                        <div role="list" aria-label="AI identified concerns" className="space-y-2">
                          {aiAnalysis.concerns.map((concern, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded" role="listitem">
                              <span className="font-medium">{concern.issue}</span>
                              <p className="text-muted-foreground">{concern.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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

          {/* Vehicle History Report (Paid Feature) */}
          <VehicleHistoryCard vin={vehicle?.vin} />

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

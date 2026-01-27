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
  NoComponentIssues,
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
  Wrench,
  Flame,
  CarFront,
  Ambulance,
  ChevronDown,
  ChevronUp,
  Calculator,
} from 'lucide-react';
import type { RedFlag, ComponentIssue, AppliedFactor, LifespanAnalysis, ReliabilityAnalysis } from '@/lib/api';

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString();
}

function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return `$${num.toLocaleString()}`;
}

function getScoreColor(s: number) {
  if (s >= 7) return 'text-green-600 dark:text-green-400';
  if (s >= 5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

interface ScoreCardProps {
  score: number | null;
  label: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

function ScoreCard({ score, label, icon, children }: ScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scoreValue = score?.toFixed(1) ?? '--';

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6 pb-4">
        <div className="flex items-center justify-center mb-2" aria-hidden="true">
          {icon}
        </div>
        <div
          className="text-center"
          role="meter"
          aria-valuenow={score ?? undefined}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-label={`${label} score: ${scoreValue} out of 10`}
        >
          <div className={`text-3xl font-bold ${score !== null ? getScoreColor(score) : 'text-muted-foreground'}`}>
            {scoreValue}
          </div>
          <div className="text-sm font-medium text-foreground">{label}</div>
        </div>

        {children && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              aria-expanded={isExpanded}
            >
              <Calculator className="size-3" />
              {isExpanded ? 'Hide calculation' : 'How calculated?'}
              {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t text-xs space-y-2">
                {children}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
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

  const { vehicle, scores, longevity, lifespanAnalysis, reliabilityAnalysis, pricing, redFlags, recalls, componentIssues, recommendation, aiAnalysis } = result;

  const hasVehicleInfo = vehicle?.make || vehicle?.model || vehicle?.year;
  const hasLongevityData = longevity && longevity.estimatedRemainingMiles !== undefined;
  const hasPricingData = pricing && pricing.askingPrice !== undefined;
  const hasRedFlags = redFlags && redFlags.length > 0;
  const hasRecalls = recalls && recalls.length > 0;
  const hasComponentIssues = componentIssues && componentIssues.length > 0;
  const hasQuestions = recommendation?.questionsForSeller && recommendation.questionsForSeller.length > 0;
  const hasAIAnalysis = aiAnalysis && !aiAnalysis.concerns?.some(c => c.issue === 'AI Analysis Unavailable');

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
        <nav className="flex items-center mb-6" aria-label="Results navigation">
          <Link href="/">
            <Button variant="ghost" size="icon" aria-label="Go back to home">
              <ArrowLeft className="size-5" aria-hidden="true" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Overall Score */}
              <ScoreCard
                score={scores?.overall ?? null}
                label="Overall"
                icon={<Target className="size-5 text-muted-foreground" />}
              >
                <div className="space-y-1.5">
                  <div className="font-medium text-foreground">Weighted Average:</div>
                  <div className="flex justify-between">
                    <span>Reliability (35%)</span>
                    <span className="font-mono">{((scores?.reliability ?? 0) * 0.35).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longevity (35%)</span>
                    <span className="font-mono">{((scores?.longevity ?? 0) * 0.35).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Value (30%)</span>
                    <span className="font-mono">{((scores?.priceValue ?? 0) * 0.30).toFixed(2)}</span>
                  </div>
                  {redFlags && redFlags.length > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Red flag penalty</span>
                      <span>−{redFlags.reduce((sum, f) => {
                        const sev = f.severity?.toLowerCase();
                        if (sev === 'critical') return sum + 5.0;
                        if (sev === 'high') return sum + 1.0;
                        if (sev === 'medium') return sum + 0.5;
                        return sum + 0.25;
                      }, 0).toFixed(1)}</span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t mt-1.5">
                    <div className="text-muted-foreground">
                      BUY ≥7.5 · MAYBE ≥5.0 · PASS &lt;5.0
                    </div>
                  </div>
                </div>
              </ScoreCard>

              {/* Reliability Score */}
              <ScoreCard
                score={scores?.reliability ?? null}
                label="Reliability"
                icon={<Shield className="size-5 text-muted-foreground" />}
              >
                <div className="space-y-1.5">
                  {reliabilityAnalysis ? (
                    <>
                      <div className="flex justify-between">
                        <span>Base score</span>
                        <span className="font-mono">{reliabilityAnalysis.baseScore.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Year adjustment</span>
                        <span className={`font-mono ${reliabilityAnalysis.yearAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {reliabilityAnalysis.yearAdjustment >= 0 ? '+' : ''}{reliabilityAnalysis.yearAdjustment.toFixed(1)}
                        </span>
                      </div>
                      {reliabilityAnalysis.isYearToAvoid && (
                        <div className="text-red-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="size-3" />
                          Known problem year
                        </div>
                      )}
                      {!reliabilityAnalysis.inDatabase && (
                        <div className="text-muted-foreground mt-1">
                          Vehicle not in database, using default score
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      Based on {vehicle?.make} {vehicle?.model} historical data
                    </div>
                  )}
                  <div className="pt-1.5 border-t mt-1.5 text-muted-foreground">
                    Weight: 35% of overall
                  </div>
                </div>
              </ScoreCard>

              {/* Longevity Score */}
              <ScoreCard
                score={scores?.longevity ?? null}
                label="Longevity"
                icon={<Clock className="size-5 text-muted-foreground" />}
              >
                <div className="space-y-1.5">
                  {lifespanAnalysis ? (
                    <>
                      <div className="flex justify-between">
                        <span>Base lifespan</span>
                        <span className="font-mono">{formatNumber(lifespanAnalysis.baseLifespan)} mi</span>
                      </div>
                      {lifespanAnalysis.appliedFactors.length > 0 && (
                        <>
                          <div className="font-medium text-foreground mt-2">Adjustments:</div>
                          {lifespanAnalysis.appliedFactors.slice(0, 4).map((factor, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="truncate pr-2">{factor.value}</span>
                              <span className={`font-mono ${factor.impact === 'positive' ? 'text-green-600' : factor.impact === 'negative' ? 'text-red-600' : ''}`}>
                                {factor.multiplier > 1 ? '+' : ''}{((factor.multiplier - 1) * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                          {lifespanAnalysis.appliedFactors.length > 4 && (
                            <div className="text-muted-foreground">+{lifespanAnalysis.appliedFactors.length - 4} more factors</div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between font-medium pt-1.5 border-t mt-1.5">
                        <span>Adjusted</span>
                        <span className="font-mono">{formatNumber(lifespanAnalysis.adjustedLifespan)} mi</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      Based on remaining useful life
                    </div>
                  )}
                  <div className="pt-1.5 border-t mt-1.5 text-muted-foreground">
                    Weight: 35% of overall
                  </div>
                </div>
              </ScoreCard>

              {/* Value Score */}
              <ScoreCard
                score={scores?.priceValue ?? null}
                label="Value"
                icon={<DollarSign className="size-5 text-muted-foreground" />}
              >
                <div className="space-y-1.5">
                  {pricing ? (
                    <>
                      <div className="flex justify-between">
                        <span>Asking</span>
                        <span className="font-mono">{formatCurrency(pricing.askingPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fair range</span>
                        <span className="font-mono text-[10px]">{formatCurrency(pricing.fairPriceLow)}-{formatCurrency(pricing.fairPriceHigh)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Deal quality</span>
                        <Badge variant={pricing.dealQuality === 'GREAT' || pricing.dealQuality === 'GOOD' ? 'default' : pricing.dealQuality === 'FAIR' ? 'secondary' : 'destructive'} className="text-[10px]">
                          {pricing.dealQuality}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      Price vs fair market value
                    </div>
                  )}
                  <div className="pt-1.5 border-t mt-1.5 text-muted-foreground">
                    Weight: 30% of overall
                  </div>
                </div>
              </ScoreCard>
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

          {/* Component Issues from NHTSA Complaints */}
          <Card className="mb-6" role="region" aria-labelledby="component-issues-heading">
            <CardHeader>
              <CardTitle id="component-issues-heading" className="text-lg flex items-center gap-2">
                <Wrench className="size-5 text-orange-500" aria-hidden="true" />
                Component Issues {hasComponentIssues && `(${componentIssues.reduce((sum, c) => sum + c.count, 0)} complaints)`}
              </CardTitle>
              <CardDescription>NHTSA complaints reported for this make/model/year</CardDescription>
            </CardHeader>
            <CardContent>
              {hasComponentIssues ? (
                <div className="space-y-4" role="list" aria-label="List of component issues">
                  {componentIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4"
                      role="listitem"
                      aria-label={`${issue.component}: ${issue.count} complaints`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{issue.component}</span>
                          <Badge variant="secondary">{issue.count} {issue.count === 1 ? 'complaint' : 'complaints'}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {issue.hasCrashes && (
                            <span className="flex items-center gap-1 text-xs text-red-600" title="Crash reported">
                              <CarFront className="size-3" aria-hidden="true" />
                              Crash
                            </span>
                          )}
                          {issue.hasFires && (
                            <span className="flex items-center gap-1 text-xs text-orange-600" title="Fire reported">
                              <Flame className="size-3" aria-hidden="true" />
                              Fire
                            </span>
                          )}
                          {issue.hasInjuries && (
                            <span className="flex items-center gap-1 text-xs text-yellow-600" title="Injury reported">
                              <Ambulance className="size-3" aria-hidden="true" />
                              Injury
                            </span>
                          )}
                        </div>
                      </div>
                      {issue.sampleComplaints.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <p className="text-xs text-muted-foreground font-medium">Sample complaints:</p>
                          {issue.sampleComplaints.map((complaint, i) => (
                            <p key={i} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                              {complaint}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <NoComponentIssues />
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

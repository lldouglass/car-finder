'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHistory } from '@/lib/history-context';
import { getVehicleDisplayName } from '@/lib/history-types';
import type { StoredAnalysis } from '@/lib/history-types';
import type { AnalysisResponse } from '@/lib/api';
import {
  getMetricsByCategory,
  determineWinner,
  formatMetricValue,
} from '@/lib/comparison-metrics';
import {
  ArrowLeft,
  Scale,
  CheckCircle,
  XCircle,
  HelpCircle,
  Trophy,
  Target,
  DollarSign,
  Clock,
  Wrench,
  AlertTriangle,
  Car,
} from 'lucide-react';

function VerdictBadge({ verdict, isWinner }: { verdict: string; isWinner?: boolean }) {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    BUY: {
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: <CheckCircle className="size-4" />,
    },
    MAYBE: {
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <HelpCircle className="size-4" />,
    },
    PASS: {
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: <XCircle className="size-4" />,
    },
  };
  const c = config[verdict] || config.MAYBE;
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${c.className}`}>
        {c.icon}
        {verdict}
      </span>
      {isWinner && (
        <Trophy className="size-5 text-yellow-500" />
      )}
    </div>
  );
}

function ComparisonRow({
  label,
  values,
  winnerIndex,
  format,
}: {
  label: string;
  values: (string | number | null)[];
  winnerIndex: number | null;
  format: 'number' | 'currency' | 'percentage' | 'text';
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] md:grid-cols-[160px_repeat(var(--cols),1fr)] gap-2 py-2 border-b last:border-b-0 items-center"
      style={{ '--cols': values.length } as React.CSSProperties}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      {values.map((value, index) => (
        <div
          key={index}
          className={`text-sm font-medium flex items-center gap-1 ${
            winnerIndex === index ? 'text-green-600 dark:text-green-400' : ''
          }`}
        >
          {formatMetricValue(value, format)}
          {winnerIndex === index && <CheckCircle className="size-3" />}
        </div>
      ))}
    </div>
  );
}

function ComparisonSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function RedFlagsComparison({ analyses }: { analyses: AnalysisResponse[] }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${analyses.length}, 1fr)` }}>
      {analyses.map((analysis, index) => (
        <div key={index} className="space-y-2">
          <div className="text-sm font-medium mb-2">
            {(analysis.redFlags?.length || 0)} red flag{(analysis.redFlags?.length || 0) !== 1 ? 's' : ''}
          </div>
          {analysis.redFlags && analysis.redFlags.length > 0 ? (
            <div className="space-y-1">
              {analysis.redFlags.slice(0, 5).map((flag, i) => (
                <div
                  key={i}
                  className={`text-xs p-2 rounded ${
                    flag.severity?.toLowerCase() === 'critical'
                      ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200'
                      : flag.severity?.toLowerCase() === 'high'
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200'
                      : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200'
                  }`}
                >
                  <span className="font-medium">{flag.severity}</span>: {flag.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="size-3" />
              No red flags found
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ComparisonViewPage() {
  const params = useParams();
  const { history, isLoading } = useHistory();
  const [items, setItems] = useState<StoredAnalysis[]>([]);

  // Parse IDs from URL
  const ids = typeof params.ids === 'string' ? params.ids.split(',') : [];

  useEffect(() => {
    if (!isLoading && ids.length > 0) {
      const found = ids
        .map((id) => history.find((h) => h.id === id))
        .filter((item): item is StoredAnalysis => item !== undefined);
      setItems(found);
    }
  }, [history, isLoading, ids]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <nav className="flex items-center gap-2 mb-6">
            <Link href="/compare">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Comparison</h1>
          </nav>

          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-muted p-4">
                <Car className="size-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Vehicles not found</h3>
            <p className="text-muted-foreground mb-4">
              Some of the selected vehicles couldn't be found in your history
            </p>
            <Link href="/compare">
              <Button>Select Vehicles</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const analyses = items.map((item) => item.analysis);

  // Determine overall winner by score
  const overallScores = analyses.map((a) => a.scores?.overall ?? 0);
  const overallWinnerIndex = overallScores.indexOf(Math.max(...overallScores));

  // Get metrics by category
  const scoreMetrics = getMetricsByCategory('scores');
  const pricingMetrics = getMetricsByCategory('pricing');
  const longevityMetrics = getMetricsByCategory('longevity');
  const maintenanceMetrics = getMetricsByCategory('maintenance');
  const riskMetrics = getMetricsByCategory('risks');

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <nav className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/compare">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="size-6" />
              Vehicle Comparison
            </h1>
          </div>
          <Badge variant="secondary">
            {items.length} vehicles
          </Badge>
        </nav>

        {/* Vehicle headers */}
        <div
          className="grid gap-4 mb-6"
          style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
        >
          {items.map((item, index) => {
            const analysis = item.analysis;
            const vehicleName = getVehicleDisplayName(analysis);
            const verdict = analysis.recommendation?.verdict || 'MAYBE';
            const score = analysis.scores?.overall;
            const isWinner = index === overallWinnerIndex;

            return (
              <Card key={item.id} className={isWinner ? 'border-yellow-400 border-2' : ''}>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-1 truncate">
                      {item.metadata.nickname || vehicleName}
                    </h3>
                    {item.metadata.nickname && (
                      <p className="text-xs text-muted-foreground mb-2 truncate">{vehicleName}</p>
                    )}
                    <div className="text-3xl font-bold mb-2">
                      {score?.toFixed(1) ?? '--'}
                      <span className="text-base font-normal text-muted-foreground">/10</span>
                    </div>
                    <VerdictBadge verdict={verdict} isWinner={isWinner} />
                    {analysis.pricing?.askingPrice && (
                      <div className="mt-2 text-lg font-semibold">
                        ${analysis.pricing.askingPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Scores comparison */}
        <ComparisonSection title="Scores" icon={<Target className="size-5 text-blue-500" />}>
          {scoreMetrics.map((metric) => (
            <ComparisonRow
              key={metric.label}
              label={metric.label}
              values={analyses.map((a) => metric.getValue(a))}
              winnerIndex={determineWinner(analyses, metric)}
              format={metric.format}
            />
          ))}
        </ComparisonSection>

        {/* Pricing comparison */}
        <ComparisonSection title="Pricing" icon={<DollarSign className="size-5 text-green-500" />}>
          {pricingMetrics.map((metric) => (
            <ComparisonRow
              key={metric.label}
              label={metric.label}
              values={analyses.map((a) => metric.getValue(a))}
              winnerIndex={determineWinner(analyses, metric)}
              format={metric.format}
            />
          ))}
        </ComparisonSection>

        {/* Longevity comparison */}
        <ComparisonSection title="Longevity" icon={<Clock className="size-5 text-purple-500" />}>
          {longevityMetrics.map((metric) => (
            <ComparisonRow
              key={metric.label}
              label={metric.label}
              values={analyses.map((a) => metric.getValue(a))}
              winnerIndex={determineWinner(analyses, metric)}
              format={metric.format}
            />
          ))}
        </ComparisonSection>

        {/* Maintenance comparison */}
        <ComparisonSection title="Maintenance Costs" icon={<Wrench className="size-5 text-orange-500" />}>
          {maintenanceMetrics.map((metric) => (
            <ComparisonRow
              key={metric.label}
              label={metric.label}
              values={analyses.map((a) => metric.getValue(a))}
              winnerIndex={determineWinner(analyses, metric)}
              format={metric.format}
            />
          ))}
        </ComparisonSection>

        {/* Risks comparison */}
        <ComparisonSection title="Risk Indicators" icon={<AlertTriangle className="size-5 text-yellow-500" />}>
          {riskMetrics.map((metric) => (
            <ComparisonRow
              key={metric.label}
              label={metric.label}
              values={analyses.map((a) => metric.getValue(a))}
              winnerIndex={determineWinner(analyses, metric)}
              format={metric.format}
            />
          ))}
        </ComparisonSection>

        {/* Red flags detail */}
        <ComparisonSection title="Red Flags Detail" icon={<AlertTriangle className="size-5 text-red-500" />}>
          <RedFlagsComparison analyses={analyses} />
        </ComparisonSection>

        {/* Footer actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/compare">
            <Button variant="outline">
              Compare Different Vehicles
            </Button>
          </Link>
          <Link href="/">
            <Button>
              Analyze Another Vehicle
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

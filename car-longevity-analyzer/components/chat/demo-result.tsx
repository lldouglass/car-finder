'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEMO_ANALYSIS, DEMO_MILEAGE, DEMO_PRICE } from '@/lib/demo-data';
import {
  Car,
  CheckCircle,
  Gauge,
  DollarSign,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface DemoResultProps {
  onTryYourVehicle?: () => void;
}

export function DemoResult({ onTryYourVehicle }: DemoResultProps) {
  const { vehicle, scores, pricing, recommendation, recalls } = DEMO_ANALYSIS;

  return (
    <div className="mt-8 w-full">
      <p className="text-sm text-muted-foreground mb-3 text-center">
        See what we found on this 2019 Camry
      </p>

      <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
        {/* Example banner */}
        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-bl-lg">
          Example Analysis
        </div>

        <CardContent className="pt-6 pb-4">
          {/* Vehicle header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Car className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">
                {vehicle?.year} {vehicle?.make} {vehicle?.model}{' '}
                <span className="font-normal text-muted-foreground">
                  {vehicle?.trim}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">
                {DEMO_MILEAGE.toLocaleString()} miles &middot; ${DEMO_PRICE.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Verdict */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold border bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
              <CheckCircle className="size-4" />
              BUY
            </span>
            <span className="text-sm text-muted-foreground">
              Score: {scores?.overall?.toFixed(1)}/10
            </span>
          </div>

          {/* Scores grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <ScoreCard
              icon={<Shield className="size-4" />}
              label="Reliability"
              value={scores?.reliability ?? 0}
            />
            <ScoreCard
              icon={<Gauge className="size-4" />}
              label="Longevity"
              value={scores?.longevity ?? 0}
            />
            <ScoreCard
              icon={<DollarSign className="size-4" />}
              label="Value"
              value={scores?.priceValue ?? 0}
            />
          </div>

          {/* Price analysis */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 mb-4 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted-foreground">Asking Price</span>
              <span className="font-medium">${pricing?.askingPrice?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fair Range</span>
              <span className="font-medium">
                ${pricing?.fairPriceLow?.toLocaleString()} - ${pricing?.fairPriceHigh?.toLocaleString()}
              </span>
            </div>
            <Badge className="mt-2 bg-green-400 text-white">Good Deal</Badge>
          </div>

          {/* Recall notice */}
          {recalls && recalls.length > 0 && (
            <div className="text-xs text-muted-foreground mb-4 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
              <span className="font-medium text-yellow-700 dark:text-yellow-400">
                1 Recall Found:
              </span>{' '}
              Fuel pump recall - verify it&apos;s been addressed
            </div>
          )}

          {/* Summary */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {recommendation?.summary}
          </p>

          {/* CTA */}
          <Button
            onClick={onTryYourVehicle}
            className="w-full"
            variant="default"
          >
            Try Your Vehicle
            <ArrowRight className="size-4 ml-2" />
          </Button>
          
          {/* Soft pricing mention */}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Want the full picture? VIN analysis includes pricing, negotiation tips, and maintenance projections. Just $19/month.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const getColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-lg font-bold ${getColor(value)}`}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

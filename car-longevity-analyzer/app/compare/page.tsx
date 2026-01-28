'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHistory } from '@/lib/history-context';
import { getVehicleDisplayName } from '@/lib/history-types';
import {
  ArrowLeft,
  Scale,
  CheckCircle,
  XCircle,
  HelpCircle,
  Car,
} from 'lucide-react';

function VerdictBadge({ verdict }: { verdict: string }) {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    BUY: {
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: <CheckCircle className="size-3" />,
    },
    MAYBE: {
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <HelpCircle className="size-3" />,
    },
    PASS: {
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: <XCircle className="size-3" />,
    },
  };
  const c = config[verdict] || config.MAYBE;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.icon}
      {verdict}
    </span>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const {
    history,
    isLoading,
    selectedForComparison,
    toggleSelection,
    clearSelection,
  } = useHistory();

  const handleCompare = () => {
    if (selectedForComparison.length >= 2) {
      router.push(`/compare/${selectedForComparison.join(',')}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (history.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <nav className="flex items-center gap-2 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="size-6" />
              Compare Vehicles
            </h1>
          </nav>

          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-muted p-4">
                <Car className="size-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Need more vehicles to compare</h3>
            <p className="text-muted-foreground mb-4">
              Analyze at least 2 vehicles to compare them side by side
            </p>
            <Link href="/">
              <Button>Analyze a Vehicle</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <nav className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="size-6" />
              Compare Vehicles
            </h1>
          </div>
        </nav>

        <p className="text-muted-foreground mb-6">
          Select 2-4 vehicles from your history to compare them side by side
        </p>

        {/* Selection bar */}
        {selectedForComparison.length > 0 && (
          <Card className="mb-4 border-primary">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="size-5 text-primary" />
                  <span className="font-medium">
                    {selectedForComparison.length} vehicle{selectedForComparison.length !== 1 ? 's' : ''} selected
                  </span>
                  <span className="text-muted-foreground text-sm">
                    (min 2, max 4)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCompare}
                    disabled={selectedForComparison.length < 2}
                  >
                    Compare Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle list */}
        <div className="space-y-3">
          {history.map((item) => {
            const isSelected = selectedForComparison.includes(item.id);
            const vehicleName = getVehicleDisplayName(item.analysis);
            const verdict = item.analysis.recommendation?.verdict || 'MAYBE';
            const score = item.analysis.scores?.overall;
            const price = item.analysis.pricing?.askingPrice;

            return (
              <button
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={`w-full text-left border rounded-lg p-4 transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div
                    className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {isSelected && <CheckCircle className="size-3" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {item.metadata.nickname || vehicleName}
                      </h3>
                      <VerdictBadge verdict={verdict} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {score !== null && score !== undefined && (
                        <span>Score: {score.toFixed(1)}</span>
                      )}
                      {price && <span>${price.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

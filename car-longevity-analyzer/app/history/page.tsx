'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useHistory } from '@/lib/history-context';
import { getVehicleDisplayName, formatRelativeTime } from '@/lib/history-types';
import type { StoredAnalysis } from '@/lib/history-types';
import {
  ArrowLeft,
  History,
  Star,
  Trash2,
  ExternalLink,
  Scale,
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
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

function HistoryItem({
  item,
  isSelected,
  onToggleSelect,
  onDelete,
  onFavorite,
}: {
  item: StoredAnalysis;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}) {
  const { analysis, source, metadata } = item;
  const vehicleName = getVehicleDisplayName(analysis);
  const verdict = analysis.recommendation?.verdict || 'MAYBE';
  const score = analysis.scores?.overall;
  const price = analysis.pricing?.askingPrice;
  const mileage = analysis.longevity?.estimatedRemainingMiles
    ? Math.round((analysis.longevity.percentUsed / 100) * (analysis.longevity.estimatedRemainingMiles / (1 - analysis.longevity.percentUsed / 100)))
    : null;

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        <button
          onClick={onToggleSelect}
          className={`mt-1 size-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground/30 hover:border-primary'
          }`}
          aria-label={isSelected ? 'Deselect for comparison' : 'Select for comparison'}
        >
          {isSelected && <CheckCircle className="size-3" />}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/results?id=${item.id}`} className="hover:underline">
              <h3 className="font-semibold text-sm truncate">
                {metadata.nickname || vehicleName}
              </h3>
            </Link>
            <VerdictBadge verdict={verdict} />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            {score !== null && score !== undefined && (
              <span className="font-medium">Score: {score.toFixed(1)}</span>
            )}
            {price && <span>${price.toLocaleString()}</span>}
            {mileage && <span>{mileage.toLocaleString()} mi</span>}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatRelativeTime(metadata.createdAt)}</span>
            <span>•</span>
            {source.type === 'vin' ? (
              <span className="font-mono">{source.vin}</span>
            ) : source.listingUrl ? (
              <a
                href={source.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                View Listing
              </a>
            ) : (
              <span>From listing</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onFavorite}
            className={`p-1.5 rounded hover:bg-muted transition-colors ${
              metadata.isFavorite ? 'text-yellow-500' : 'text-muted-foreground'
            }`}
            aria-label={metadata.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`size-4 ${metadata.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete analysis"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-muted p-4">
          <Car className="size-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
      <p className="text-muted-foreground mb-4">
        Analyze your first vehicle to start building your history
      </p>
      <Link href="/">
        <Button>
          <Search className="size-4 mr-2" />
          Analyze a Vehicle
        </Button>
      </Link>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const {
    history,
    isLoading,
    removeAnalysis,
    updateAnalysisMetadata,
    clearAllHistory,
    selectedForComparison,
    toggleSelection,
    clearSelection,
  } = useHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'price'>('date');

  // Filter and sort history
  const filteredHistory = history
    .filter((item) => {
      if (!searchQuery) return true;
      const name = getVehicleDisplayName(item.analysis).toLowerCase();
      const nickname = item.metadata.nickname?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || nickname.includes(query);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.analysis.scores?.overall ?? 0) - (a.analysis.scores?.overall ?? 0);
        case 'price':
          return (a.analysis.pricing?.askingPrice ?? Infinity) - (b.analysis.pricing?.askingPrice ?? Infinity);
        case 'date':
        default:
          return b.metadata.createdAt - a.metadata.createdAt;
      }
    });

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
            <div className="h-24 bg-muted rounded" />
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
              <Button variant="ghost" size="icon" aria-label="Go back to home">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="size-6" />
              Analysis History
            </h1>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to clear all history?')) {
                  clearAllHistory();
                }
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4 mr-1" />
              Clear All
            </Button>
          )}
        </nav>

        {history.length === 0 ? (
          <EmptyHistory />
        ) : (
          <>
            {/* Comparison bar */}
            {selectedForComparison.length > 0 && (
              <Card className="mb-4 border-primary">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="size-5 text-primary" />
                      <span className="font-medium">
                        {selectedForComparison.length} vehicle{selectedForComparison.length !== 1 ? 's' : ''} selected
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

            {/* Search and Sort */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'price')}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="date">Most Recent</option>
                <option value="score">Highest Score</option>
                <option value="price">Lowest Price</option>
              </select>
            </div>

            {/* History list */}
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  isSelected={selectedForComparison.includes(item.id)}
                  onToggleSelect={() => toggleSelection(item.id)}
                  onDelete={() => {
                    if (confirm('Delete this analysis?')) {
                      removeAnalysis(item.id);
                    }
                  }}
                  onFavorite={() =>
                    updateAnalysisMetadata(item.id, { isFavorite: !item.metadata.isFavorite })
                  }
                />
              ))}
            </div>

            {filteredHistory.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                No vehicles match "{searchQuery}"
              </div>
            )}

            {/* Footer hint */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Select 2-4 vehicles to compare them side by side
            </p>
          </>
        )}
      </div>
    </div>
  );
}

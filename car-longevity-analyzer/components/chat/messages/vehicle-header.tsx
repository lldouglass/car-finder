'use client';

import { useState } from 'react';
import type { AnalysisResponse } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { Car, CheckCircle, HelpCircle, XCircle, Share2, Check, Loader2 } from 'lucide-react';

interface VehicleHeaderProps {
  result: AnalysisResponse;
  showShareButton?: boolean;
}

export function VehicleHeader({ result, showShareButton = true }: VehicleHeaderProps) {
  const { vehicle, recommendation, scores } = result;

  const hasVehicleInfo = vehicle?.make || vehicle?.model || vehicle?.year;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm p-4">
      <div className="flex items-start gap-4">
        {/* Vehicle icon */}
        <div className="flex-shrink-0 rounded-full bg-primary/10 p-3">
          <Car className="size-6 text-primary" />
        </div>

        {/* Vehicle info */}
        <div className="flex-1 min-w-0">
          {/* Share button in top right */}
          {showShareButton && (
            <div className="float-right ml-2">
              <ShareButton analysisData={result} />
            </div>
          )}
          {hasVehicleInfo ? (
            <h2 className="text-xl font-bold">
              {vehicle?.color && (
                <span className="font-normal text-muted-foreground">
                  {vehicle.color}{' '}
                </span>
              )}
              {vehicle?.year || 'Unknown'} {vehicle?.make || 'Unknown'}{' '}
              {vehicle?.model || 'Unknown'}
              {vehicle?.trim && (
                <span className="font-normal text-muted-foreground">
                  {' '}{vehicle.trim}
                </span>
              )}
            </h2>
          ) : (
            <h2 className="text-xl font-bold text-muted-foreground">
              Vehicle Details Unavailable
            </h2>
          )}

          {/* Verdict badge */}
          {recommendation?.verdict && (
            <div className="mt-2">
              <VerdictBadge verdict={recommendation.verdict} />
            </div>
          )}

          {/* Summary */}
          {recommendation?.summary && (
            <p className="mt-3 text-muted-foreground">{recommendation.summary}</p>
          )}

          {/* Score preview */}
          {scores?.overall !== null && scores?.overall !== undefined && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <ScoreItem label="Overall" value={scores.overall} />
              {scores.reliability !== null && (
                <ScoreItem label="Reliability" value={scores.reliability} />
              )}
              {scores.longevity !== null && (
                <ScoreItem label="Longevity" value={scores.longevity} />
              )}
              {scores.priceValue !== null && (
                <ScoreItem label="Value" value={scores.priceValue} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: 'BUY' | 'MAYBE' | 'PASS' }) {
  const config = {
    BUY: {
      className:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
      icon: <CheckCircle className="size-4" />,
      label: 'Recommended',
    },
    MAYBE: {
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      icon: <HelpCircle className="size-4" />,
      label: 'Consider with caution',
    },
    PASS: {
      className:
        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800',
      icon: <XCircle className="size-4" />,
      label: 'Not recommended',
    },
  };

  const c = config[verdict];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold border ${c.className}`}
      role="status"
      aria-label={c.label}
    >
      {c.icon}
      {verdict}
    </span>
  );
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  const getColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${getColor(value)}`}>{value.toFixed(1)}</span>
    </div>
  );
}

function ShareButton({ analysisData }: { analysisData: AnalysisResponse }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { addToast } = useToast();

  const handleShare = async () => {
    if (isLoading || isCopied) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisData }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create share link');
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl);

      setIsCopied(true);
      addToast('Link copied to clipboard!', 'success');

      // Reset copied state after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Share error:', error);
      addToast('Failed to create share link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isLoading}
      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
      title={isCopied ? 'Copied!' : 'Share report'}
      aria-label={isCopied ? 'Link copied' : 'Share report'}
    >
      {isLoading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : isCopied ? (
        <Check className="size-5 text-green-500" />
      ) : (
        <Share2 className="size-5" />
      )}
    </button>
  );
}

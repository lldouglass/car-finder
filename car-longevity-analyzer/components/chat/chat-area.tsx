'use client';

import { useRef, useEffect } from 'react';
import { useAnalysis } from '@/lib/analysis-context';
import { ChatInput } from './chat-input';
import { UserMessage } from './messages/user-message';
import { VehicleHeader } from './messages/vehicle-header';
import { ResultsDisplay } from './results-display';
import { LoadingMessage } from './messages/loading-message';
import { Car, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatAreaProps {
  onUpgradeClick?: () => void;
}

export function ChatArea({ onUpgradeClick }: ChatAreaProps) {
  const { result, isLoading, error, history, currentId, needsUpgrade, clearNeedsUpgrade } = useAnalysis();
  const resultsTopRef = useRef<HTMLDivElement>(null);

  // Find the current history item to show the input summary
  const currentItem = currentId ? history.find((h) => h.id === currentId) : null;

  // Scroll to top of results when analysis completes
  useEffect(() => {
    if (result && !isLoading) {
      resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result, isLoading]);

  // Show upgrade modal when free limit is reached
  useEffect(() => {
    if (needsUpgrade && onUpgradeClick) {
      onUpgradeClick();
      clearNeedsUpgrade();
    }
  }, [needsUpgrade, onUpgradeClick, clearNeedsUpgrade]);

  const hasContent = result || isLoading || error;

  // When empty, show centered layout with input
  if (!hasContent) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-6 rounded-full bg-primary/10 p-4 w-fit">
                <Car className="size-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                Car Longevity Analyzer
              </h1>
              <p className="text-muted-foreground text-lg">
                Get instant insights on reliability, longevity, and value for any used car
              </p>
            </div>

            {/* Centered input */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
              <ChatInput large />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When there's content, show chat layout with input at bottom
  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* User message showing what was searched */}
          {currentItem && (
            <UserMessage
              inputType={currentItem.inputType}
              inputSummary={currentItem.inputSummary}
            />
          )}

          {/* Loading state */}
          {isLoading && <LoadingMessage />}

          {/* Error state */}
          {error && !isLoading && (
            <div className={`rounded-lg p-4 ${
              error.includes('Free limit') || error.includes('free analyses')
                ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
            }`}>
              {error.includes('Free limit') || error.includes('free analyses') ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <Crown className="size-8 text-amber-500" />
                  <p className="text-amber-700 dark:text-amber-400 font-medium">{error}</p>
                  <Button
                    onClick={onUpgradeClick}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
                  >
                    <Crown className="size-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              ) : (
                <p className="text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          )}

          {/* Analysis results */}
          {result && !isLoading && (
            <>
              <div ref={resultsTopRef} />
              <VehicleHeader result={result} />
              <ResultsDisplay result={result} />
            </>
          )}
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}

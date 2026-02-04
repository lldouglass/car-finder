'use client';

import { useRef, useEffect } from 'react';
import { useAnalysis } from '@/lib/analysis-context';
import { ChatInput } from './chat-input';
import { UserMessage } from './messages/user-message';
import { VehicleHeader } from './messages/vehicle-header';
import { ResultsDisplay } from './results-display';
import { LoadingMessage } from './messages/loading-message';
import { Car, Crown, LogIn, Shield, Database, Zap } from 'lucide-react';
import { DemoResult } from './demo-result';
import { Button } from '@/components/ui/button';
import { SignInButton } from '@clerk/nextjs';

interface ChatAreaProps {
  onUpgradeClick?: () => void;
}

export function ChatArea({ onUpgradeClick }: ChatAreaProps) {
  const { result, isLoading, error, history, currentId, needsUpgrade, clearNeedsUpgrade } = useAnalysis();
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleTryYourVehicle = () => {
    inputRef.current?.focus();
  };

  // When empty, show centered layout with input
  if (!hasContent) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center px-4 py-8">
            <div className="w-full max-w-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto mb-6 rounded-full bg-primary/10 p-4 w-fit">
                  <Car className="size-12 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-3">
                  Don&apos;t Buy a Lemon.
                </h1>
                <p className="text-muted-foreground text-lg">
                  Find out if a used car is overpriced, unreliable, or hiding problems — in 60 seconds.
                </p>
              </div>

              {/* Centered input */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
                <ChatInput large inputRef={inputRef} />
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="size-4" />
                  NHTSA Data
                </span>
                <span className="flex items-center gap-1">
                  <Database className="size-4" />
                  200+ Models
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="size-4" />
                  Instant Results
                </span>
              </div>

              {/* Demo result */}
              <DemoResult onTryYourVehicle={handleTryYourVehicle} />
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
                : error.toLowerCase().includes('sign in') || error.toLowerCase().includes('unauthorized')
                ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
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
                    Get 30 Days Unlimited
                  </Button>
                </div>
              ) : error.toLowerCase().includes('sign in') || error.toLowerCase().includes('unauthorized') ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <LogIn className="size-8 text-blue-500" />
                  <p className="text-blue-700 dark:text-blue-400 font-medium">Sign in to analyze vehicles</p>
                  <p className="text-blue-600/70 dark:text-blue-400/70 text-sm">Create a free account to get started with 3 free analyses</p>
                  <SignInButton mode="modal">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                      <LogIn className="size-4 mr-2" />
                      Sign In
                    </Button>
                  </SignInButton>
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

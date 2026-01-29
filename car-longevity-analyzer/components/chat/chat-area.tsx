'use client';

import { useRef, useEffect } from 'react';
import { useAnalysis } from '@/lib/analysis-context';
import { ChatInput } from './chat-input';
import { UserMessage } from './messages/user-message';
import { VehicleHeader } from './messages/vehicle-header';
import { AnalysisCard } from './messages/analysis-card';
import { LoadingMessage } from './messages/loading-message';
import { Car } from 'lucide-react';

export function ChatArea() {
  const { result, isLoading, error, history, currentId } = useAnalysis();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find the current history item to show the input summary
  const currentItem = currentId ? history.find((h) => h.id === currentId) : null;

  // Scroll to bottom when new content appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [result, isLoading]);

  const hasContent = result || isLoading || error;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {hasContent ? (
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
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Analysis results */}
            {result && !isLoading && (
              <>
                <VehicleHeader result={result} />
                <AnalysisCard result={result} />
              </>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center h-full px-4">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-6 rounded-full bg-primary/10 p-4 w-fit">
                <Car className="size-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Car Longevity Analyzer
              </h1>
              <p className="text-muted-foreground mb-8">
                Get instant insights on reliability, longevity, and value for any
                used car. Enter a VIN or paste a listing to start.
              </p>
            </div>
          </div>
        )}
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

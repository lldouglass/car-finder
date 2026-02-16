'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useAnalysis } from '@/lib/analysis-context';
import { ChatInput, type ChatInputHandle } from './chat-input';
import { UserMessage } from './messages/user-message';
import { VehicleHeader } from './messages/vehicle-header';
import { ResultsDisplay } from './results-display';
import { LoadingMessage } from './messages/loading-message';
import { Car, Crown, Shield, Database, Zap, Search, CheckCircle, TrendingUp, DollarSign, FileText, BarChart3, Target, Users, Star, CheckSquare, Archive } from 'lucide-react';
import { DemoResult } from './demo-result';
import { Button } from '@/components/ui/button';
import { SignUpGate } from '@/components/sign-up-gate';
import { SignUpBanner } from '@/components/sign-up-banner';

interface ChatAreaProps {
  onUpgradeClick?: () => void;
}

export function ChatArea({ onUpgradeClick }: ChatAreaProps) {
  const { result, isLoading, error, history, currentId, needsUpgrade, clearNeedsUpgrade } = useAnalysis();
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);

  // Find the current history item to show the input summary
  const currentItem = currentId ? history.find((h) => h.id === currentId) : null;

  const handleSwitchToVin = useCallback(() => {
    chatInputRef.current?.switchToVin();
  }, []);

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
                  How Long Will Your Car Last?
                </h1>
                <p className="text-muted-foreground text-lg mb-2">
                  Search any vehicle by make, model, and year — free, instant reliability reports.
                </p>
                <p className="text-muted-foreground text-sm">
                  Or use your VIN for a detailed analysis with pricing and lifespan projections.
                </p>
              </div>

              {/* Centered input */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
                <ChatInput large inputRef={inputRef} />
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Search className="size-4" />
                  Free Search
                </span>
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

              {/* How It Works Section */}
              <div className="mt-12">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">How It Works</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Get the data you need to make smart car buying decisions in three simple steps
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4">
                    <div className="mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 w-fit">
                      <Search className="size-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Step 1: Search</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter any year, make, model (free) or paste a VIN for detailed analysis
                    </p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 p-3 w-fit">
                      <BarChart3 className="size-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Step 2: Analyze</h3>
                    <p className="text-sm text-muted-foreground">
                      Get instant reliability scores, safety data, and known issues from official sources
                    </p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 w-fit">
                      <TrendingUp className="size-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Step 3: Upgrade</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock full analysis with pricing, negotiation tips, and maintenance projections
                    </p>
                  </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="size-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Free Tier</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-green-600" />
                        Unlimited basic searches
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-green-600" />
                        Reliability scores
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-green-600" />
                        Safety ratings
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-green-600" />
                        Recall alerts
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="size-5 text-amber-600" />
                      <h3 className="text-lg font-semibold">Premium</h3>
                      <span className="ml-auto text-xl font-bold text-amber-600">$5.99</span>
                      <span className="text-sm text-muted-foreground">/30 days</span>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-amber-600" />
                        Unlimited VIN analyses
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-amber-600" />
                        Fair price estimates
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-amber-600" />
                        Negotiation strategies
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-amber-600" />
                        Maintenance projections
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-amber-600" />
                        Pre-purchase checklists
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Social Proof / Trust Signals */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Trusted by Car Buyers Nationwide</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3">
                      <div className="mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 w-fit">
                        <Shield className="size-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="font-semibold text-sm">Powered by</p>
                      <p className="text-xs text-muted-foreground">Official NHTSA Data</p>
                    </div>
                    
                    <div className="p-3">
                      <div className="mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/30 p-2 w-fit">
                        <Database className="size-5 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="font-semibold text-sm">200+</p>
                      <p className="text-xs text-muted-foreground">Vehicle Models Covered</p>
                    </div>
                    
                    <div className="p-3">
                      <div className="mx-auto mb-2 rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 w-fit">
                        <BarChart3 className="size-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="font-semibold text-sm">10,000+</p>
                      <p className="text-xs text-muted-foreground">Vehicles Analyzed</p>
                    </div>
                    
                    <div className="p-3">
                      <div className="mx-auto mb-2 rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 w-fit">
                        <Users className="size-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="font-semibold text-sm">Used by</p>
                      <p className="text-xs text-muted-foreground">Car Buyers Across the US</p>
                    </div>
                  </div>
                </div>

                {/* What Our Users Discover */}
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">What Our Users Discover</h3>
                    <p className="text-muted-foreground text-sm">Real insights that help make better car buying decisions</p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1.5 mt-0.5">
                          <Target className="size-3 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "Saved me from buying a 2017 Nissan Altima with known CVT transmission issues"
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1.5 mt-0.5">
                          <TrendingUp className="size-3 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "Found out my Toyota Camry has 150,000+ miles of life left"
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5 mt-0.5">
                          <DollarSign className="size-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "The fair price estimate helped me negotiate $2,000 off the asking price"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              error.includes('Free limit') || error.includes('free analyses') || error.includes('Daily search limit')
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
                    Get 30 Days Unlimited
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
              {result.analysisType === 'vehicle' ? (
                <>
                  <ResultsDisplay result={result} onSwitchToVin={handleSwitchToVin} />
                  <SignUpBanner />
                </>
              ) : (
                <SignUpGate>
                  <ResultsDisplay result={result} onSwitchToVin={handleSwitchToVin} />
                </SignUpGate>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput ref={chatInputRef} />
        </div>
      </div>
    </div>
  );
}

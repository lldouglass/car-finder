'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAnalysis } from '@/lib/analysis-context';
import { useToast } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/error-boundary';
import { AnalyzingOverlay } from '@/components/results-skeleton';
import { analyzeByVin, analyzeByListing, APIError } from '@/lib/api';
import { Car, Search, FileText, Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const { setResult, isLoading, setIsLoading, error, setError } = useAnalysis();
  const { addToast } = useToast();

  // VIN form state
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [askingPrice, setAskingPrice] = useState('');

  // Listing form state
  const [listingText, setListingText] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingMileage, setListingMileage] = useState('');

  // Track last submission for retry
  const [lastSubmission, setLastSubmission] = useState<{
    type: 'vin' | 'listing';
    data: unknown;
  } | null>(null);

  // Track if error is retryable
  const [isRetryable, setIsRetryable] = useState(false);

  const handleVinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setIsRetryable(false);

    const data = {
      vin: vin.toUpperCase(),
      mileage: parseInt(mileage, 10),
      askingPrice: parseInt(askingPrice, 10),
    };

    setLastSubmission({ type: 'vin', data });

    try {
      const result = await analyzeByVin(data);
      setResult(result);
      addToast('Analysis complete!', 'success');
      router.push('/results');
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'An unexpected error occurred';
      const retryable = err instanceof APIError ? err.isRetryable : false;
      setError(message);
      setIsRetryable(retryable);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setIsRetryable(false);

    const data = {
      listingText,
      askingPrice: listingPrice ? parseInt(listingPrice, 10) : undefined,
      mileage: listingMileage ? parseInt(listingMileage, 10) : undefined,
    };

    setLastSubmission({ type: 'listing', data });

    try {
      const result = await analyzeByListing(data);
      setResult(result);
      addToast('Analysis complete!', 'success');
      router.push('/results');
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'An unexpected error occurred';
      const retryable = err instanceof APIError ? err.isRetryable : false;
      setError(message);
      setIsRetryable(retryable);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!lastSubmission) return;

    setError(null);
    setIsLoading(true);
    setIsRetryable(false);

    try {
      let result;
      if (lastSubmission.type === 'vin') {
        result = await analyzeByVin(lastSubmission.data as Parameters<typeof analyzeByVin>[0]);
      } else {
        result = await analyzeByListing(lastSubmission.data as Parameters<typeof analyzeByListing>[0]);
      }
      setResult(result);
      addToast('Analysis complete!', 'success');
      router.push('/results');
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'An unexpected error occurred';
      const retryable = err instanceof APIError ? err.isRetryable : false;
      setError(message);
      setIsRetryable(retryable);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isNetworkError = error?.toLowerCase().includes('network') || error?.toLowerCase().includes('connection');

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      {/* Loading Overlay */}
      {isLoading && <AnalyzingOverlay />}

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Skip link for accessibility */}
        <a
          href="#main-form"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
        >
          Skip to main form
        </a>

        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4" aria-hidden="true">
            <div className="rounded-full bg-primary/10 p-4">
              <Car className="size-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Car Longevity Analyzer
          </h1>
          <p className="text-muted-foreground">
            Get instant insights on reliability, longevity, and value for any used car
          </p>
        </header>

        <main id="main-form">
          {/* Error Alert with Retry */}
          {error && (
            <Alert
              variant="destructive"
              className="mb-6"
              role="alert"
              aria-live="assertive"
            >
              {isNetworkError ? (
                <WifiOff className="size-4" aria-hidden="true" />
              ) : (
                <AlertCircle className="size-4" aria-hidden="true" />
              )}
              <AlertTitle>
                {isNetworkError ? 'Connection Error' : 'Analysis Failed'}
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                <span>{error}</span>
                {(lastSubmission && isRetryable) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isLoading}
                    aria-label="Retry the analysis"
                  >
                    <RefreshCw className="size-4 mr-1" aria-hidden="true" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Card */}
          <Card>
            <CardHeader>
              <CardTitle id="form-title">Analyze a Vehicle</CardTitle>
              <CardDescription>
                Enter a VIN for the most accurate analysis, or paste a listing for AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="vin" className="w-full">
                <TabsList className="w-full mb-6" aria-label="Analysis method">
                  <TabsTrigger
                    value="vin"
                    className="flex-1"
                    aria-label="Analyze by VIN number"
                  >
                    <Search className="size-4 mr-2" aria-hidden="true" />
                    VIN Lookup
                  </TabsTrigger>
                  <TabsTrigger
                    value="listing"
                    className="flex-1"
                    aria-label="Analyze by pasting listing text"
                  >
                    <FileText className="size-4 mr-2" aria-hidden="true" />
                    Paste Listing
                  </TabsTrigger>
                </TabsList>

                {/* VIN Tab */}
                <TabsContent value="vin">
                  <form
                    onSubmit={handleVinSubmit}
                    className="space-y-4"
                    aria-labelledby="form-title"
                  >
                    <div>
                      <label
                        htmlFor="vin"
                        className="block text-sm font-medium mb-1.5"
                      >
                        Vehicle Identification Number (VIN)
                      </label>
                      <Input
                        id="vin"
                        placeholder="e.g., 1HGBH41JXMN109186"
                        value={vin}
                        onChange={(e) => setVin(e.target.value.toUpperCase())}
                        maxLength={17}
                        pattern="^[A-HJ-NPR-Z0-9]{17}$"
                        required
                        disabled={isLoading}
                        className="font-mono"
                        aria-describedby="vin-help"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <p id="vin-help" className="text-xs text-muted-foreground mt-1">
                        17 characters, usually found on dashboard or door jamb
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="mileage"
                          className="block text-sm font-medium mb-1.5"
                        >
                          Current Mileage
                        </label>
                        <Input
                          id="mileage"
                          type="number"
                          placeholder="e.g., 75000"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          min={0}
                          max={999999}
                          required
                          disabled={isLoading}
                          aria-describedby="mileage-help"
                        />
                        <p id="mileage-help" className="sr-only">
                          Enter the current odometer reading in miles
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="price"
                          className="block text-sm font-medium mb-1.5"
                        >
                          Asking Price ($)
                        </label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="e.g., 15000"
                          value={askingPrice}
                          onChange={(e) => setAskingPrice(e.target.value)}
                          min={0}
                          max={9999999}
                          required
                          disabled={isLoading}
                          aria-describedby="price-help"
                        />
                        <p id="price-help" className="sr-only">
                          Enter the seller's asking price in dollars
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      size="lg"
                      aria-busy={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Search className="size-4 mr-2" aria-hidden="true" />
                          <span>Analyze VIN</span>
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Listing Tab */}
                <TabsContent value="listing">
                  <form
                    onSubmit={handleListingSubmit}
                    className="space-y-4"
                    aria-labelledby="form-title"
                  >
                    <div>
                      <label
                        htmlFor="listing"
                        className="block text-sm font-medium mb-1.5"
                      >
                        Listing Text
                      </label>
                      <Textarea
                        id="listing"
                        placeholder="Paste the full listing description here..."
                        value={listingText}
                        onChange={(e) => setListingText(e.target.value)}
                        required
                        disabled={isLoading}
                        className="min-h-[150px]"
                        aria-describedby="listing-help"
                      />
                      <p id="listing-help" className="text-xs text-muted-foreground mt-1">
                        Copy and paste the entire listing from Craigslist, Facebook Marketplace, etc.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="listingMileage"
                          className="block text-sm font-medium mb-1.5"
                        >
                          Mileage (optional)
                        </label>
                        <Input
                          id="listingMileage"
                          type="number"
                          placeholder="If known"
                          value={listingMileage}
                          onChange={(e) => setListingMileage(e.target.value)}
                          min={0}
                          max={999999}
                          disabled={isLoading}
                          aria-describedby="listing-mileage-help"
                        />
                        <p id="listing-mileage-help" className="sr-only">
                          Optional: Enter mileage if not in listing
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="listingPrice"
                          className="block text-sm font-medium mb-1.5"
                        >
                          Price (optional)
                        </label>
                        <Input
                          id="listingPrice"
                          type="number"
                          placeholder="If known"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          min={0}
                          max={9999999}
                          disabled={isLoading}
                          aria-describedby="listing-price-help"
                        />
                        <p id="listing-price-help" className="sr-only">
                          Optional: Enter price if not in listing
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      size="lg"
                      aria-busy={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="size-4 mr-2" aria-hidden="true" />
                          <span>Analyze Listing</span>
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer info */}
          <footer className="mt-6">
            <p className="text-center text-xs text-muted-foreground">
              Data sourced from NHTSA, reliability databases, and AI analysis.
              Results are for informational purposes only.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  );
}

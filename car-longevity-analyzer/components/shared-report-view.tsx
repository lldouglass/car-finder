'use client';

import Link from 'next/link';
import { Car, Calendar, ExternalLink } from 'lucide-react';
import { VehicleHeader } from '@/components/chat/messages/vehicle-header';
import { ResultsDisplay } from '@/components/chat/results-display';
import { Button } from '@/components/ui/button';
import type { AnalysisResponse } from '@/lib/api';

interface SharedReportViewProps {
  analysisData: AnalysisResponse;
  createdAt: string;
}

export function SharedReportView({ analysisData, createdAt }: SharedReportViewProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const vehicleTitle = analysisData.vehicle
    ? `${analysisData.vehicle.year || ''} ${analysisData.vehicle.make || ''} ${analysisData.vehicle.model || ''}`.trim()
    : 'Vehicle Analysis';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90">
            <Car className="size-6" />
            <span className="font-semibold hidden sm:inline">Car Lifespan Check</span>
          </Link>

          <Button asChild>
            <Link href="/">
              Analyze Your Vehicle
              <ExternalLink className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Shared report indicator */}
      <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <Calendar className="size-4" />
          <span>Shared report from {formattedDate}</span>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Vehicle Header */}
        <VehicleHeader result={analysisData} showShareButton={false} />

        {/* Full Results */}
        <ResultsDisplay result={analysisData} />
      </main>

      {/* Footer CTA */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h2 className="text-xl font-bold mb-2">
            Want to analyze your own vehicle?
          </h2>
          <p className="text-muted-foreground mb-4">
            Get instant reliability scores, price analysis, and red flag detection.
          </p>
          <Button size="lg" asChild>
            <Link href="/">
              <Car className="size-5 mr-2" />
              Start Free Analysis
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}

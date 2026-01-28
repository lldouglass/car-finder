'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  FileSearch,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  DollarSign,
} from 'lucide-react';
import { fetchVehicleHistory, type VehicleHistoryResponse, type VehicleHistory, type HistoryAnalysis } from '@/lib/api';

interface VehicleHistoryCardProps {
  vin?: string;
  onHistoryLoaded?: (history: VehicleHistory, analysis: HistoryAnalysis) => void;
}

function TitleBrandBadge({ brand }: { brand: string }) {
  const isCritical = ['SALVAGE', 'REBUILT', 'FLOOD', 'FIRE', 'JUNK'].some(
    b => brand.toUpperCase().includes(b)
  );

  return (
    <Badge
      variant={isCritical ? 'destructive' : 'secondary'}
      className={isCritical ? 'bg-red-600' : ''}
    >
      {brand}
    </Badge>
  );
}

function OdometerTimeline({ records }: { records: Array<{ date: string; reading: number; source?: string }> }) {
  if (records.length === 0) return null;

  // Sort by date
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">Odometer History</p>
      <div className="relative pl-4 border-l-2 border-muted space-y-3">
        {sorted.map((record, index) => (
          <div key={index} className="relative">
            <div className="absolute -left-[13px] w-2 h-2 rounded-full bg-primary" />
            <div className="text-sm">
              <span className="font-medium">{record.reading.toLocaleString()} miles</span>
              <span className="text-muted-foreground ml-2">
                {new Date(record.date).toLocaleDateString()}
              </span>
              {record.source && (
                <span className="text-xs text-muted-foreground ml-2">({record.source})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VehicleHistoryCard({ vin, onHistoryLoaded }: VehicleHistoryCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VehicleHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchHistory = async () => {
    if (!vin) {
      setError('No VIN available for history lookup');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchVehicleHistory(vin);
      setResult(response);

      if (response.success && response.history && response.analysis && onHistoryLoaded) {
        onHistoryLoaded(response.history, response.analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle history');
    } finally {
      setIsLoading(false);
    }
  };

  // No VIN available
  if (!vin) {
    return (
      <Card className="mb-6 opacity-60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="size-5" aria-hidden="true" />
            Vehicle History Report
          </CardTitle>
          <CardDescription>
            VIN required for history lookup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Analyze a vehicle by VIN to access vehicle history reports.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Not yet fetched - show the fetch button
  if (!result) {
    return (
      <Card className="mb-6" role="region" aria-labelledby="history-heading">
        <CardHeader>
          <CardTitle id="history-heading" className="text-lg flex items-center gap-2">
            <FileSearch className="size-5" aria-hidden="true" />
            Vehicle History Report
          </CardTitle>
          <CardDescription>
            Check title brands, odometer history, and more (NMVTIS data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">
                Get official vehicle history including:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  Title brands (salvage, rebuilt, flood, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-primary" />
                  Odometer discrepancy detection
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-primary" />
                  Theft and total loss records
                </li>
              </ul>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <DollarSign className="size-4" />
                <span>~$1-2 per report</span>
              </div>
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleFetchHistory}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Fetching History...
              </>
            ) : (
              <>
                <FileSearch className="size-4 mr-2" />
                Get Vehicle History Report
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Error result
  if (!result.success) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="size-5" aria-hidden="true" />
            Vehicle History Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Unable to Fetch History</AlertTitle>
            <AlertDescription>
              {result.error || 'Unknown error occurred'}
              {result.featureAvailable === false && (
                <p className="mt-2 text-xs">
                  This feature requires a VinAudit API key to be configured.
                </p>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleFetchHistory} disabled={isLoading}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Success - show the history data
  const { history, analysis } = result;

  return (
    <Card className="mb-6" role="region" aria-labelledby="history-heading">
      <CardHeader>
        <CardTitle id="history-heading" className="text-lg flex items-center gap-2">
          <FileSearch className="size-5" aria-hidden="true" />
          Vehicle History Report
          {result.cached && (
            <Badge variant="outline" className="ml-2 text-xs">Cached</Badge>
          )}
        </CardTitle>
        {analysis && (
          <CardDescription className={
            analysis.hasCriticalIssue ? 'text-red-600 dark:text-red-400 font-medium' :
            analysis.hasHighRiskIssue ? 'text-orange-600 dark:text-orange-400 font-medium' :
            'text-green-600 dark:text-green-400'
          }>
            {analysis.recommendation}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title Status */}
        <div>
          <p className="font-medium text-sm mb-2">Title Status</p>
          {history?.titleBrands && history.titleBrands.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {history.titleBrands.map((brand, index) => (
                <TitleBrandBadge key={index} brand={brand} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="size-4" />
              <span className="text-sm">Clean Title</span>
            </div>
          )}
        </div>

        {/* Issues Found */}
        {analysis?.issues && analysis.issues.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-2">Issues Found</p>
            <div className="space-y-2">
              {analysis.issues.map((issue, index) => (
                <Alert
                  key={index}
                  variant={issue.severity === 'critical' ? 'destructive' : 'default'}
                  className={
                    issue.severity === 'critical' ? '' :
                    issue.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' :
                    'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                  }
                >
                  {issue.severity === 'critical' ? (
                    <AlertCircle className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                  <AlertTitle className="capitalize">{issue.severity} Issue</AlertTitle>
                  <AlertDescription>{issue.description}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Odometer History */}
        {history?.odometerRecords && history.odometerRecords.length > 0 && (
          <OdometerTimeline records={history.odometerRecords} />
        )}

        {/* Odometer Discrepancy Warning */}
        {history?.odometerDiscrepancy && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Odometer Discrepancy</AlertTitle>
            <AlertDescription>
              The odometer readings in this vehicle's history show inconsistencies.
              This could indicate odometer rollback or tampering.
            </AlertDescription>
          </Alert>
        )}

        {/* Theft Record */}
        {history?.theftRecord && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Theft Record</AlertTitle>
            <AlertDescription>
              This vehicle has a theft record. Verify ownership carefully.
            </AlertDescription>
          </Alert>
        )}

        {/* Total Loss */}
        {history?.totalLoss && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Total Loss</AlertTitle>
            <AlertDescription>
              This vehicle was declared a total loss by an insurance company.
            </AlertDescription>
          </Alert>
        )}

        {/* No Issues Found */}
        {analysis && !analysis.hasCriticalIssue && !analysis.hasHighRiskIssue && analysis.issues.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="size-5 text-green-600" />
            <span className="text-sm text-green-800 dark:text-green-200">
              No major history issues detected. Always get an independent inspection.
            </span>
          </div>
        )}
      </CardContent>
      {result.remainingCalls !== undefined && (
        <CardFooter className="text-xs text-muted-foreground">
          {result.remainingCalls} lookups remaining today
        </CardFooter>
      )}
    </Card>
  );
}

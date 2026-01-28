import type { AnalysisResponse } from './api';
import type { ComparisonMetric } from './history-types';

export const COMPARISON_METRICS: ComparisonMetric[] = [
  // Scores section
  {
    category: 'scores',
    label: 'Overall Score',
    getValue: (a) => a.scores?.overall ?? null,
    format: 'number',
    higherIsBetter: true,
  },
  {
    category: 'scores',
    label: 'Reliability',
    getValue: (a) => a.scores?.reliability ?? null,
    format: 'number',
    higherIsBetter: true,
  },
  {
    category: 'scores',
    label: 'Longevity',
    getValue: (a) => a.scores?.longevity ?? null,
    format: 'number',
    higherIsBetter: true,
  },
  {
    category: 'scores',
    label: 'Value',
    getValue: (a) => a.scores?.priceValue ?? null,
    format: 'number',
    higherIsBetter: true,
  },

  // Pricing section
  {
    category: 'pricing',
    label: 'Asking Price',
    getValue: (a) => a.pricing?.askingPrice ?? null,
    format: 'currency',
    higherIsBetter: false,
  },
  {
    category: 'pricing',
    label: 'Fair Price (Low)',
    getValue: (a) => a.pricing?.fairPriceLow ?? null,
    format: 'currency',
    higherIsBetter: false,
  },
  {
    category: 'pricing',
    label: 'Fair Price (High)',
    getValue: (a) => a.pricing?.fairPriceHigh ?? null,
    format: 'currency',
    higherIsBetter: false,
  },

  // Longevity section
  {
    category: 'longevity',
    label: 'Remaining Miles',
    getValue: (a) => a.longevity?.estimatedRemainingMiles ?? null,
    format: 'number',
    higherIsBetter: true,
  },
  {
    category: 'longevity',
    label: 'Remaining Years',
    getValue: (a) => a.longevity?.remainingYears ?? null,
    format: 'number',
    higherIsBetter: true,
  },
  {
    category: 'longevity',
    label: 'Life Used',
    getValue: (a) => a.longevity?.percentUsed ?? null,
    format: 'percentage',
    higherIsBetter: false,
  },

  // Maintenance section
  {
    category: 'maintenance',
    label: '5-Year Cost (Low)',
    getValue: (a) => a.maintenanceCosts?.fiveYearProjection?.low ?? null,
    format: 'currency',
    higherIsBetter: false,
  },
  {
    category: 'maintenance',
    label: '5-Year Cost (High)',
    getValue: (a) => a.maintenanceCosts?.fiveYearProjection?.high ?? null,
    format: 'currency',
    higherIsBetter: false,
  },
  {
    category: 'maintenance',
    label: 'Annual Cost (Low)',
    getValue: (a) => a.maintenanceCosts?.estimatedAnnualCost?.low ?? null,
    format: 'currency',
    higherIsBetter: false,
  },

  // Risks section
  {
    category: 'risks',
    label: 'Red Flags',
    getValue: (a) => a.redFlags?.length ?? 0,
    format: 'number',
    higherIsBetter: false,
  },
  {
    category: 'risks',
    label: 'Open Recalls',
    getValue: (a) => a.recalls?.length ?? 0,
    format: 'number',
    higherIsBetter: false,
  },
  {
    category: 'risks',
    label: 'Component Issues',
    getValue: (a) => a.componentIssues?.length ?? 0,
    format: 'number',
    higherIsBetter: false,
  },
];

// Get metrics by category
export function getMetricsByCategory(category: ComparisonMetric['category']): ComparisonMetric[] {
  return COMPARISON_METRICS.filter((m) => m.category === category);
}

// Determine the winner for a metric
export function determineWinner(
  analyses: AnalysisResponse[],
  metric: ComparisonMetric
): number | null {
  const values = analyses.map((a) => metric.getValue(a));

  // Filter to only numeric values
  const numericValues = values.map((v) => (typeof v === 'number' ? v : null));

  // Check if we have at least 2 valid values
  const validCount = numericValues.filter((v) => v !== null).length;
  if (validCount < 2) return null;

  // Find best value
  const validNumbers = numericValues.filter((v): v is number => v !== null);
  const bestValue = metric.higherIsBetter
    ? Math.max(...validNumbers)
    : Math.min(...validNumbers);

  // Check if there's a meaningful difference (>5%)
  const range = Math.max(...validNumbers) - Math.min(...validNumbers);
  const threshold = Math.abs(bestValue) * 0.05;
  if (range < threshold && range > 0) return null; // Too close to call

  // Find the index of the winner
  const winnerIndex = numericValues.findIndex((v) => v === bestValue);
  return winnerIndex >= 0 ? winnerIndex : null;
}

// Format a value for display
export function formatMetricValue(value: number | string | null, format: ComparisonMetric['format']): string {
  if (value === null) return 'N/A';

  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'percentage':
      return `${value}%`;
    case 'number':
    default:
      return typeof value === 'number' && !Number.isInteger(value)
        ? value.toFixed(1)
        : value.toLocaleString();
  }
}

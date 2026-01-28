import type { AnalysisResponse } from './api';

// Stored analysis with metadata
export interface StoredAnalysis {
  id: string;
  analysis: AnalysisResponse;
  source: {
    type: 'vin' | 'listing';
    vin?: string;
    listingUrl?: string;
    listingText?: string; // Truncated for display
  };
  metadata: {
    createdAt: number; // Unix timestamp
    updatedAt: number;
    nickname?: string; // User-assigned name like "Dad's Camry"
    notes?: string;
    isFavorite: boolean;
  };
}

// Comparison session
export interface ComparisonSession {
  id: string;
  name?: string;
  analysisIds: string[]; // IDs of analyses being compared (2-4)
  createdAt: number;
}

// Comparison metrics for side-by-side view
export interface ComparisonMetric {
  category: 'scores' | 'pricing' | 'risks' | 'maintenance' | 'longevity';
  label: string;
  getValue: (analysis: AnalysisResponse) => number | string | null;
  format: 'number' | 'currency' | 'percentage' | 'text';
  higherIsBetter?: boolean;
}

// Storage configuration
export const HISTORY_CONFIG = {
  STORAGE_KEY: 'car-analyzer-history',
  COMPARISONS_KEY: 'car-analyzer-comparisons',
  MAX_HISTORY_ITEMS: 50,
  MAX_LISTING_TEXT_STORED: 500,
  MAX_COMPARISONS: 10,
};

// Get vehicle display name from analysis
export function getVehicleDisplayName(analysis: AnalysisResponse): string {
  const { vehicle } = analysis;
  if (!vehicle) return 'Unknown Vehicle';

  const parts = [
    vehicle.year?.toString(),
    vehicle.make,
    vehicle.model,
    vehicle.trim,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' ') : 'Unknown Vehicle';
}

// Format relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return new Date(timestamp).toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    return 'Just now';
  }
}

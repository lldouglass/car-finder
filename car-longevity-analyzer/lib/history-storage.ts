import type { StoredAnalysis, ComparisonSession } from './history-types';
import { HISTORY_CONFIG } from './history-types';

// Generate a unique ID
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// Load history from localStorage
export function loadHistory(): StoredAnalysis[] {
  if (!isBrowser()) return [];

  try {
    const data = localStorage.getItem(HISTORY_CONFIG.STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

// Save history to localStorage
export function saveHistory(history: StoredAnalysis[]): boolean {
  if (!isBrowser()) return false;

  try {
    // Enforce max items limit (FIFO eviction)
    const trimmed = history.slice(-HISTORY_CONFIG.MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_CONFIG.STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch (error) {
    console.error('Failed to save history:', error);
    // If storage is full, try to clear old items
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        const reduced = history.slice(-Math.floor(HISTORY_CONFIG.MAX_HISTORY_ITEMS / 2));
        localStorage.setItem(HISTORY_CONFIG.STORAGE_KEY, JSON.stringify(reduced));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

// Add a new analysis to history
export function addToHistory(
  history: StoredAnalysis[],
  analysis: StoredAnalysis['analysis'],
  source: StoredAnalysis['source']
): { history: StoredAnalysis[]; id: string } {
  const id = generateId();
  const now = Date.now();

  // Truncate listing text if too long
  const truncatedSource = { ...source };
  if (truncatedSource.listingText && truncatedSource.listingText.length > HISTORY_CONFIG.MAX_LISTING_TEXT_STORED) {
    truncatedSource.listingText = truncatedSource.listingText.slice(0, HISTORY_CONFIG.MAX_LISTING_TEXT_STORED) + '...';
  }

  const storedAnalysis: StoredAnalysis = {
    id,
    analysis,
    source: truncatedSource,
    metadata: {
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
    },
  };

  return {
    history: [...history, storedAnalysis],
    id,
  };
}

// Get a specific analysis by ID
export function getAnalysisById(history: StoredAnalysis[], id: string): StoredAnalysis | null {
  return history.find((item) => item.id === id) || null;
}

// Update an analysis
export function updateAnalysis(
  history: StoredAnalysis[],
  id: string,
  updates: Partial<StoredAnalysis['metadata']>
): StoredAnalysis[] {
  return history.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        metadata: {
          ...item.metadata,
          ...updates,
          updatedAt: Date.now(),
        },
      };
    }
    return item;
  });
}

// Delete an analysis
export function deleteAnalysis(history: StoredAnalysis[], id: string): StoredAnalysis[] {
  return history.filter((item) => item.id !== id);
}

// Clear all history
export function clearHistory(): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.removeItem(HISTORY_CONFIG.STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

// Load comparisons from localStorage
export function loadComparisons(): ComparisonSession[] {
  if (!isBrowser()) return [];

  try {
    const data = localStorage.getItem(HISTORY_CONFIG.COMPARISONS_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

// Save comparisons to localStorage
export function saveComparisons(comparisons: ComparisonSession[]): boolean {
  if (!isBrowser()) return false;

  try {
    const trimmed = comparisons.slice(-HISTORY_CONFIG.MAX_COMPARISONS);
    localStorage.setItem(HISTORY_CONFIG.COMPARISONS_KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    return false;
  }
}

// Create a new comparison
export function createComparison(
  comparisons: ComparisonSession[],
  analysisIds: string[],
  name?: string
): { comparisons: ComparisonSession[]; id: string } {
  const id = generateId();

  const session: ComparisonSession = {
    id,
    name,
    analysisIds,
    createdAt: Date.now(),
  };

  return {
    comparisons: [...comparisons, session],
    id,
  };
}

// Delete a comparison
export function deleteComparison(comparisons: ComparisonSession[], id: string): ComparisonSession[] {
  return comparisons.filter((c) => c.id !== id);
}

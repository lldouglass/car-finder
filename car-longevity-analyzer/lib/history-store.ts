import type { AnalysisResponse } from './api';

const STORAGE_KEY = 'car-analyzer-history';
const STORAGE_VERSION = 1;
const MAX_ITEMS = 50;

export interface ChatHistory {
  id: string;
  timestamp: number;
  starred: boolean;
  vehicle: { year: number; make: string; model: string } | null;
  inputType: 'vin' | 'listing';
  inputSummary: string; // VIN or first 100 chars of listing
  verdict: 'BUY' | 'MAYBE' | 'PASS' | null;
  fullResult: AnalysisResponse;
}

interface StoredData {
  version: number;
  history: ChatHistory[];
}

/**
 * Generate unique ID for history items
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Load history from localStorage
 */
export function loadHistory(): ChatHistory[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data: StoredData = JSON.parse(stored);

    // Version migration if needed
    if (data.version !== STORAGE_VERSION) {
      return migrateHistory(data);
    }

    return data.history;
  } catch {
    // Invalid data - clear and return empty
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Save history to localStorage
 */
export function saveHistory(history: ChatHistory[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data: StoredData = {
      version: STORAGE_VERSION,
      history,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Storage full - try to make room
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      const trimmed = trimHistory(history, Math.floor(history.length / 2));
      const data: StoredData = {
        version: STORAGE_VERSION,
        history: trimmed,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        console.warn('Failed to save history to localStorage');
      }
    }
  }
}

/**
 * Add a new history item
 */
export function addHistoryItem(
  history: ChatHistory[],
  item: Omit<ChatHistory, 'id' | 'timestamp' | 'starred'>
): ChatHistory[] {
  const newItem: ChatHistory = {
    ...item,
    id: generateId(),
    timestamp: Date.now(),
    starred: false,
  };

  const updated = [newItem, ...history];

  // Enforce max items, preserving starred items
  return trimHistory(updated, MAX_ITEMS);
}

/**
 * Trim history to maxItems, removing oldest non-starred items first
 */
function trimHistory(history: ChatHistory[], maxItems: number): ChatHistory[] {
  if (history.length <= maxItems) return history;

  // Separate starred and non-starred
  const starred = history.filter((h) => h.starred);
  const nonStarred = history.filter((h) => !h.starred);

  // Keep all starred items if possible
  if (starred.length >= maxItems) {
    // Too many starred items - keep most recent
    return starred.slice(0, maxItems);
  }

  // Keep all starred + most recent non-starred up to max
  const remainingSlots = maxItems - starred.length;
  const keptNonStarred = nonStarred.slice(0, remainingSlots);

  // Rebuild in timestamp order
  return [...starred, ...keptNonStarred].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Toggle starred status of an item
 */
export function toggleStarred(history: ChatHistory[], id: string): ChatHistory[] {
  return history.map((item) =>
    item.id === id ? { ...item, starred: !item.starred } : item
  );
}

/**
 * Delete a history item
 */
export function deleteHistoryItem(history: ChatHistory[], id: string): ChatHistory[] {
  return history.filter((item) => item.id !== id);
}

/**
 * Get history item by ID
 */
export function getHistoryItem(history: ChatHistory[], id: string): ChatHistory | undefined {
  return history.find((item) => item.id === id);
}

/**
 * Migrate history from older versions
 */
function migrateHistory(data: StoredData): ChatHistory[] {
  // Currently no migrations needed, but structure is in place
  // Future versions can add migration logic here

  // For now, if version doesn't match, just return the history as-is
  // or clear if it's too old/incompatible
  if (!data.history || !Array.isArray(data.history)) {
    return [];
  }

  return data.history;
}

/**
 * Create input summary from analysis input
 */
export function createInputSummary(inputType: 'vin' | 'listing', input: string): string {
  if (inputType === 'vin') {
    return input.toUpperCase();
  }
  // For listings, take first 100 chars
  return input.length > 100 ? `${input.substring(0, 100)}...` : input;
}

/**
 * Extract vehicle info from analysis response
 */
export function extractVehicleInfo(
  result: AnalysisResponse
): { year: number; make: string; model: string } | null {
  if (!result.vehicle?.year || !result.vehicle?.make || !result.vehicle?.model) {
    return null;
  }
  return {
    year: result.vehicle.year,
    make: result.vehicle.make,
    model: result.vehicle.model,
  };
}

/**
 * Get display name for a history item
 */
export function getHistoryDisplayName(item: ChatHistory): string {
  if (item.vehicle) {
    return `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`;
  }
  if (item.inputType === 'vin') {
    return `VIN: ${item.inputSummary}`;
  }
  return 'Unknown Vehicle';
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  // Format as date for older items
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Group history items by date category
 */
export function groupHistoryByDate(history: ChatHistory[]): {
  starred: ChatHistory[];
  today: ChatHistory[];
  yesterday: ChatHistory[];
  older: ChatHistory[];
} {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;

  const starred: ChatHistory[] = [];
  const today: ChatHistory[] = [];
  const yesterday: ChatHistory[] = [];
  const older: ChatHistory[] = [];

  for (const item of history) {
    if (item.starred) {
      starred.push(item);
    } else if (item.timestamp >= startOfToday) {
      today.push(item);
    } else if (item.timestamp >= startOfYesterday) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  }

  return { starred, today, yesterday, older };
}

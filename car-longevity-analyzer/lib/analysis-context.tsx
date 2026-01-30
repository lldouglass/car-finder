'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AnalysisResponse, analyzeByVin, analyzeByListing, APIError, type SellerType } from './api';
import {
  ChatHistory,
  loadHistory,
  saveHistory,
  addHistoryItem,
  toggleStarred,
  deleteHistoryItem,
  getHistoryItem,
  createInputSummary,
  extractVehicleInfo,
} from './history-store';

interface AnalysisContextType {
  // Current analysis state
  result: AnalysisResponse | null;
  currentId: string | null;
  isLoading: boolean;
  error: string | null;
  needsUpgrade: boolean;

  // History
  history: ChatHistory[];

  // Actions
  submitAnalysis: (
    inputType: 'vin' | 'listing',
    input: string,
    mileage?: number,
    price?: number,
    sellerType?: string
  ) => Promise<void>;
  loadAnalysis: (id: string) => void;
  toggleStar: (id: string) => void;
  deleteAnalysis: (id: string) => void;
  startNewAnalysis: () => void;
  setError: (error: string | null) => void;
  clearNeedsUpgrade: () => void;

  // Legacy support
  setResult: (result: AnalysisResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  clearResult: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResultState] = useState<AnalysisResponse | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadHistory();
    setHistory(stored);
    setIsHydrated(true);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      saveHistory(history);
    }
  }, [history, isHydrated]);

  // Submit a new analysis
  const submitAnalysis = useCallback(
    async (
      inputType: 'vin' | 'listing',
      input: string,
      mileage?: number,
      price?: number,
      sellerType?: string
    ) => {
      setError(null);
      setNeedsUpgrade(false);
      setIsLoading(true);
      setCurrentId(null);
      setResultState(null);

      try {
        let analysisResult: AnalysisResponse;

        if (inputType === 'vin') {
          analysisResult = await analyzeByVin({
            vin: input.toUpperCase(),
            mileage: mileage || 0,
            askingPrice: price || 0,
            sellerType: sellerType as SellerType | undefined,
          });
        } else {
          analysisResult = await analyzeByListing({
            listingText: input,
            mileage,
            askingPrice: price,
            sellerType: sellerType as SellerType | undefined,
          });
        }

        // Add to history
        const newHistory = addHistoryItem(history, {
          vehicle: extractVehicleInfo(analysisResult),
          inputType,
          inputSummary: createInputSummary(inputType, input),
          verdict: analysisResult.recommendation?.verdict || null,
          fullResult: analysisResult,
        });

        setHistory(newHistory);
        setResultState(analysisResult);
        setCurrentId(newHistory[0].id); // New item is at the front
      } catch (err) {
        const message = err instanceof APIError ? err.message : 'An unexpected error occurred';
        // Check if this is an upgrade-needed error (403 status)
        if (err instanceof APIError && err.status === 403) {
          setNeedsUpgrade(true);
        }
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [history]
  );

  // Load an analysis from history
  const loadAnalysis = useCallback(
    (id: string) => {
      const item = getHistoryItem(history, id);
      if (item) {
        setResultState(item.fullResult);
        setCurrentId(id);
        setError(null);
      }
    },
    [history]
  );

  // Toggle star on a history item
  const toggleStar = useCallback((id: string) => {
    setHistory((prev) => toggleStarred(prev, id));
  }, []);

  // Delete a history item
  const deleteAnalysis = useCallback(
    (id: string) => {
      setHistory((prev) => deleteHistoryItem(prev, id));
      // If we deleted the current item, clear the result
      if (currentId === id) {
        setResultState(null);
        setCurrentId(null);
      }
    },
    [currentId]
  );

  // Start a new analysis (clear current state)
  const startNewAnalysis = useCallback(() => {
    setResultState(null);
    setCurrentId(null);
    setError(null);
  }, []);

  // Legacy setResult wrapper - also adds to history
  const setResult = useCallback((newResult: AnalysisResponse | null) => {
    setResultState(newResult);
    if (newResult === null) {
      setCurrentId(null);
    }
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setResultState(null);
    setCurrentId(null);
    setError(null);
  }, []);

  // Clear needs upgrade flag
  const clearNeedsUpgrade = useCallback(() => {
    setNeedsUpgrade(false);
  }, []);

  // Don't render children until hydrated to avoid flash
  if (!isHydrated) {
    return null;
  }

  return (
    <AnalysisContext.Provider
      value={{
        result,
        currentId,
        isLoading,
        error,
        needsUpgrade,
        history,
        submitAnalysis,
        loadAnalysis,
        toggleStar,
        deleteAnalysis,
        startNewAnalysis,
        setError,
        clearNeedsUpgrade,
        setResult,
        setIsLoading,
        clearResult,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}

// Re-export ChatHistory type for consumers
export type { ChatHistory };

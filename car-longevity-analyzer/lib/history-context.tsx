'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AnalysisResponse } from './api';
import type { StoredAnalysis, ComparisonSession } from './history-types';
import {
  loadHistory,
  saveHistory,
  addToHistory,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
  clearHistory as clearHistoryStorage,
  loadComparisons,
  saveComparisons,
  createComparison,
  deleteComparison,
} from './history-storage';

interface HistoryContextType {
  // History state
  history: StoredAnalysis[];
  isLoading: boolean;

  // CRUD operations
  saveAnalysis: (analysis: AnalysisResponse, source: StoredAnalysis['source']) => string;
  getAnalysis: (id: string) => StoredAnalysis | null;
  removeAnalysis: (id: string) => void;
  updateAnalysisMetadata: (id: string, updates: Partial<StoredAnalysis['metadata']>) => void;
  clearAllHistory: () => void;

  // Comparison operations
  comparisons: ComparisonSession[];
  addComparison: (analysisIds: string[], name?: string) => string;
  removeComparison: (id: string) => void;

  // Selection state for comparison
  selectedForComparison: string[];
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;

  // Utility
  historyCount: number;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<StoredAnalysis[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonSession[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
    setComparisons(loadComparisons());
    setIsLoading(false);
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (!isLoading) {
      saveHistory(history);
    }
  }, [history, isLoading]);

  // Save comparisons when they change
  useEffect(() => {
    if (!isLoading) {
      saveComparisons(comparisons);
    }
  }, [comparisons, isLoading]);

  const saveAnalysisToHistory = useCallback(
    (analysis: AnalysisResponse, source: StoredAnalysis['source']): string => {
      const result = addToHistory(history, analysis, source);
      setHistory(result.history);
      return result.id;
    },
    [history]
  );

  const getAnalysisFromHistory = useCallback(
    (id: string): StoredAnalysis | null => {
      return getAnalysisById(history, id);
    },
    [history]
  );

  const removeAnalysis = useCallback(
    (id: string): void => {
      setHistory((prev) => deleteAnalysis(prev, id));
      // Also remove from selection if selected
      setSelectedForComparison((prev) => prev.filter((i) => i !== id));
    },
    []
  );

  const updateAnalysisMetadata = useCallback(
    (id: string, updates: Partial<StoredAnalysis['metadata']>): void => {
      setHistory((prev) => updateAnalysis(prev, id, updates));
    },
    []
  );

  const clearAllHistory = useCallback((): void => {
    setHistory([]);
    setSelectedForComparison([]);
    clearHistoryStorage();
  }, []);

  const addComparisonSession = useCallback(
    (analysisIds: string[], name?: string): string => {
      const result = createComparison(comparisons, analysisIds, name);
      setComparisons(result.comparisons);
      return result.id;
    },
    [comparisons]
  );

  const removeComparisonSession = useCallback(
    (id: string): void => {
      setComparisons((prev) => deleteComparison(prev, id));
    },
    []
  );

  const toggleSelection = useCallback((id: string): void => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      // Max 4 vehicles for comparison
      if (prev.length >= 4) {
        // Remove oldest, add new
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  const clearSelection = useCallback((): void => {
    setSelectedForComparison([]);
  }, []);

  const isSelected = useCallback(
    (id: string): boolean => {
      return selectedForComparison.includes(id);
    },
    [selectedForComparison]
  );

  const value: HistoryContextType = {
    history,
    isLoading,
    saveAnalysis: saveAnalysisToHistory,
    getAnalysis: getAnalysisFromHistory,
    removeAnalysis,
    updateAnalysisMetadata,
    clearAllHistory,
    comparisons,
    addComparison: addComparisonSession,
    removeComparison: removeComparisonSession,
    selectedForComparison,
    toggleSelection,
    clearSelection,
    isSelected,
    historyCount: history.length,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextType {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}

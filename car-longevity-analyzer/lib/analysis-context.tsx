'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AnalysisResponse } from './api';

const STORAGE_KEY = 'car-analyzer-result';
const STORAGE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface StoredResult {
    result: AnalysisResponse;
    timestamp: number;
}

interface AnalysisContextType {
    result: AnalysisResponse | null;
    setResult: (result: AnalysisResponse | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    clearResult: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

/**
 * Safely get stored result from sessionStorage
 */
function getStoredResult(): AnalysisResponse | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const parsed: StoredResult = JSON.parse(stored);

        // Check if result has expired
        if (Date.now() - parsed.timestamp > STORAGE_EXPIRY_MS) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return parsed.result;
    } catch {
        // Invalid JSON or other error - clear storage
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

/**
 * Safely store result in sessionStorage
 */
function storeResult(result: AnalysisResponse | null): void {
    if (typeof window === 'undefined') return;

    try {
        if (result === null) {
            sessionStorage.removeItem(STORAGE_KEY);
        } else {
            const stored: StoredResult = {
                result,
                timestamp: Date.now()
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        }
    } catch {
        // Storage full or other error - ignore
        console.warn('Failed to persist analysis result to sessionStorage');
    }
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
    const [result, setResultState] = useState<AnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydrate from sessionStorage on mount
    useEffect(() => {
        const stored = getStoredResult();
        if (stored) {
            setResultState(stored);
        }
        setIsHydrated(true);
    }, []);

    // Wrapper to persist result when setting
    const setResult = useCallback((newResult: AnalysisResponse | null) => {
        setResultState(newResult);
        storeResult(newResult);
    }, []);

    // Clear result from both state and storage
    const clearResult = useCallback(() => {
        setResultState(null);
        storeResult(null);
        setError(null);
    }, []);

    // Don't render children until hydrated to avoid flash
    if (!isHydrated) {
        return null;
    }

    return (
        <AnalysisContext.Provider
            value={{ result, setResult, isLoading, setIsLoading, error, setError, clearResult }}
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

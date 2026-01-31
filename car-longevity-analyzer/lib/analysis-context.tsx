'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AnalysisResponse } from './api';

const STORAGE_KEY = 'car-analyzer-result';
const FORM_STORAGE_KEY = 'car-analyzer-form';
const STORAGE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface StoredResult {
    result: AnalysisResponse;
    timestamp: number;
}

export interface FormState {
    vin: string;
    mileage: string;
    askingPrice: string;
    listingText: string;
    listingPrice: string;
    listingMileage: string;
    activeTab: 'vin' | 'listing';
}

const DEFAULT_FORM_STATE: FormState = {
    vin: '',
    mileage: '',
    askingPrice: '',
    listingText: '',
    listingPrice: '',
    listingMileage: '',
    activeTab: 'vin',
};

interface AnalysisContextType {
    result: AnalysisResponse | null;
    setResult: (result: AnalysisResponse | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    clearResult: () => void;
    formState: FormState;
    updateFormState: (updates: Partial<FormState>) => void;
    clearFormState: () => void;
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

/**
 * Safely get stored form state from sessionStorage
 */
function getStoredFormState(): FormState {
    if (typeof window === 'undefined') return DEFAULT_FORM_STATE;

    try {
        const stored = sessionStorage.getItem(FORM_STORAGE_KEY);
        if (!stored) return DEFAULT_FORM_STATE;

        const parsed = JSON.parse(stored) as FormState;
        return { ...DEFAULT_FORM_STATE, ...parsed };
    } catch {
        sessionStorage.removeItem(FORM_STORAGE_KEY);
        return DEFAULT_FORM_STATE;
    }
}

/**
 * Safely store form state in sessionStorage
 */
function storeFormState(formState: FormState): void {
    if (typeof window === 'undefined') return;

    try {
        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formState));
    } catch {
        console.warn('Failed to persist form state to sessionStorage');
    }
}

/**
 * Clear form state from sessionStorage
 */
function clearStoredFormState(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(FORM_STORAGE_KEY);
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
    const [result, setResultState] = useState<AnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [formState, setFormStateInternal] = useState<FormState>(DEFAULT_FORM_STATE);

    // Hydrate from sessionStorage on mount
    useEffect(() => {
        const storedResult = getStoredResult();
        if (storedResult) {
            setResultState(storedResult);
        }
        const storedForm = getStoredFormState();
        setFormStateInternal(storedForm);
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

    // Update form state with partial updates
    const updateFormState = useCallback((updates: Partial<FormState>) => {
        setFormStateInternal(prev => {
            const newState = { ...prev, ...updates };
            storeFormState(newState);
            return newState;
        });
    }, []);

    // Clear form state
    const clearFormState = useCallback(() => {
        setFormStateInternal(DEFAULT_FORM_STATE);
        clearStoredFormState();
    }, []);

    // Don't render children until hydrated to avoid flash
    if (!isHydrated) {
        return null;
    }

    return (
        <AnalysisContext.Provider
            value={{
                result,
                setResult,
                isLoading,
                setIsLoading,
                error,
                setError,
                clearResult,
                formState,
                updateFormState,
                clearFormState,
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

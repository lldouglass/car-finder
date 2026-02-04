import type { AnalysisResponse } from '@/lib/api';

/**
 * Static demo analysis for a 2019 Toyota Camry LE.
 * Shows a positive example with realistic data including one recall.
 */
export const DEMO_ANALYSIS: AnalysisResponse = {
  success: true,
  vehicle: {
    year: 2019,
    make: 'Toyota',
    model: 'Camry',
    trim: 'LE',
    color: null,
  },
  scores: {
    reliability: 9.2,
    longevity: 8.5,
    priceValue: 7.8,
    overall: 8.5,
  },
  longevity: {
    estimatedRemainingMiles: 205000,
    remainingYears: 14,
    percentUsed: 18,
    expectedLifespan: 250000,
    baseLifespan: 250000,
  },
  pricing: {
    askingPrice: 22500,
    fairPriceLow: 21000,
    fairPriceHigh: 24000,
    dealQuality: 'GOOD',
    analysis: 'This price is competitive for a well-maintained Camry with this mileage. Toyota Camrys hold their value well due to their reputation for reliability.',
    source: 'calculated',
    confidence: 'medium',
  },
  redFlags: [],
  recalls: [
    {
      component: 'Fuel Pump',
      summary: 'The fuel pump may fail, causing the engine to stall. Dealers will replace the fuel pump free of charge.',
      date: '2020-03-10',
    },
  ],
  recommendation: {
    verdict: 'BUY',
    confidence: 85,
    summary: 'This 2019 Toyota Camry LE is an excellent choice. Toyota Camrys are known for exceptional reliability and longevity. At 45,000 miles, this vehicle has plenty of life remaining. The asking price is fair for the market. One recall exists for the fuel pump - verify it has been addressed.',
    questionsForSeller: [
      'Has the fuel pump recall been completed?',
      'Can you provide service records showing regular oil changes?',
      'Has the vehicle had any accidents or body work?',
    ],
  },
  safetyRating: {
    overallRating: '5',
    frontalCrashRating: '5',
    sideCrashRating: '5',
    rolloverRating: '4',
    complaintsCount: 127,
    recallsCount: 1,
  },
  lifespanAnalysis: {
    baseLifespan: 250000,
    adjustedLifespan: 250000,
    totalMultiplier: 1.0,
    appliedFactors: [
      {
        category: 'Transmission',
        value: 'Automatic',
        multiplier: 1.0,
        impact: 'neutral',
      },
      {
        category: 'Engine',
        value: 'Naturally Aspirated',
        multiplier: 1.0,
        impact: 'neutral',
      },
    ],
    confidence: 'medium',
  },
};

export const DEMO_MILEAGE = 45000;
export const DEMO_PRICE = 22500;

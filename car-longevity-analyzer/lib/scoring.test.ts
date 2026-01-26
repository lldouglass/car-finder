import { describe, it, expect } from 'vitest';
import {
    calculateReliabilityScore,
    calculateLongevityScore,
    calculatePriceScore,
    calculateOverallScore,
} from './scoring';

describe('calculateReliabilityScore', () => {
    it('returns base score for known reliable vehicle', () => {
        const score = calculateReliabilityScore('Toyota', 'Camry', 2020, []);
        expect(score).toBeGreaterThanOrEqual(9);
        expect(score).toBeLessThanOrEqual(10);
    });

    it('returns default score for unknown vehicle', () => {
        const score = calculateReliabilityScore('Unknown', 'Model', 2020, []);
        expect(score).toBe(5.5); // Default 5.0 + 0.5 for newer year
    });

    it('penalizes years to avoid', () => {
        const goodYear = calculateReliabilityScore('Toyota', 'Camry', 2020, []);
        const badYear = calculateReliabilityScore('Toyota', 'Camry', 2008, []); // Year to avoid
        expect(badYear).toBeLessThan(goodYear);
    });

    it('deducts for known issues', () => {
        const noIssues = calculateReliabilityScore('Toyota', 'Camry', 2020, []);
        const withIssues = calculateReliabilityScore('Toyota', 'Camry', 2020, [
            { severity: 'MAJOR' },
            { severity: 'MINOR' },
        ]);
        expect(withIssues).toBeLessThan(noIssues);
    });

    it('clamps score between 1 and 10', () => {
        // Many critical issues should still not go below 1
        const score = calculateReliabilityScore('Unknown', 'Model', 2000, [
            { severity: 'CRITICAL' },
            { severity: 'CRITICAL' },
            { severity: 'CRITICAL' },
        ]);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(10);
    });
});

describe('calculateLongevityScore', () => {
    it('returns high score for low mileage vehicle', () => {
        const result = calculateLongevityScore(300000, 30000);
        expect(result.score).toBeGreaterThan(8);
        expect(result.remainingMiles).toBe(270000);
        expect(result.percentUsed).toBe(10);
    });

    it('returns low score for high mileage vehicle', () => {
        const result = calculateLongevityScore(200000, 180000);
        expect(result.score).toBeLessThan(3);
        expect(result.remainingMiles).toBe(20000);
        expect(result.percentUsed).toBe(90);
    });

    it('handles vehicle past expected lifespan', () => {
        const result = calculateLongevityScore(200000, 250000);
        expect(result.score).toBe(1);
        expect(result.remainingMiles).toBe(0);
        expect(result.percentUsed).toBe(100); // Capped at 100
    });

    it('calculates remaining years correctly', () => {
        const result = calculateLongevityScore(240000, 0, 12000);
        expect(result.remainingYears).toBe(20); // 240000 / 12000
    });

    it('handles edge case: zero expected lifespan', () => {
        const result = calculateLongevityScore(0, 50000);
        expect(result.score).toBe(5);
        expect(result.remainingMiles).toBe(0);
        expect(result.percentUsed).toBe(100);
    });

    it('handles edge case: negative mileage', () => {
        const result = calculateLongevityScore(200000, -5000);
        expect(result.score).toBe(10);
        expect(result.remainingMiles).toBe(200000);
    });

    it('handles edge case: NaN inputs', () => {
        const result = calculateLongevityScore(NaN, 50000);
        expect(result.score).toBe(5);
    });

    it('handles edge case: Infinity inputs', () => {
        const result = calculateLongevityScore(Infinity, 50000);
        expect(result.score).toBe(5);
    });
});

describe('calculatePriceScore', () => {
    it('returns high score for price below fair range', () => {
        const result = calculatePriceScore(9500, 10000, 12000);
        expect(result.score).toBeGreaterThan(7);
        expect(result.dealQuality).toBe('GOOD'); // 9500/10000 = 95% > 90%, so GOOD not GREAT
    });

    it('returns great deal for significantly below range', () => {
        const result = calculatePriceScore(8000, 10000, 12000);
        // 8000 is 80% of low price (10000), which is < 90%, so GREAT
        expect(result.dealQuality).toBe('GREAT'); // 8000/10000 = 80% < 90%

        const greatDeal = calculatePriceScore(7000, 10000, 12000);
        expect(greatDeal.dealQuality).toBe('GREAT'); // 7000 is 70% of 10000
    });

    it('returns fair for price within range', () => {
        const result = calculatePriceScore(11000, 10000, 12000);
        expect(result.score).toBeGreaterThanOrEqual(4);
        expect(result.score).toBeLessThanOrEqual(7);
        expect(result.dealQuality).toBe('FAIR');
    });

    it('returns low score for overpriced vehicle', () => {
        const result = calculatePriceScore(15000, 10000, 12000);
        expect(result.score).toBeLessThan(4);
        expect(result.dealQuality).toBe('OVERPRICED');
    });

    it('returns HIGH for slightly above range', () => {
        const result = calculatePriceScore(13000, 10000, 12000);
        // 13000 is ~108% of high (12000), less than 115%
        expect(result.dealQuality).toBe('HIGH');
    });

    it('handles edge case: zero fair price', () => {
        const result = calculatePriceScore(5000, 0, 0);
        expect(result.score).toBeGreaterThanOrEqual(1);
        expect(result.score).toBeLessThanOrEqual(10);
    });

    it('handles edge case: negative asking price', () => {
        const result = calculatePriceScore(-1000, 10000, 12000);
        expect(result.score).toBe(5);
        expect(result.dealQuality).toBe('FAIR');
    });

    it('handles edge case: swapped low/high prices', () => {
        // Should auto-correct
        const result = calculatePriceScore(11000, 12000, 10000);
        expect(result.dealQuality).toBe('FAIR');
    });

    it('handles edge case: equal low and high prices', () => {
        const exactMatch = calculatePriceScore(10000, 10000, 10000);
        expect(exactMatch.score).toBe(7);

        // When asking > high with equal low/high, it's overpriced
        // 11000/10000 = 110% of high, so score is 4 - (0.1/0.2)*3 = 2.5
        const notMatch = calculatePriceScore(11000, 10000, 10000);
        expect(notMatch.score).toBe(2.5);
        expect(notMatch.dealQuality).toBe('HIGH'); // 110% < 115% threshold
    });

    it('clamps score between 1 and 10', () => {
        const veryLow = calculatePriceScore(1000, 10000, 12000);
        expect(veryLow.score).toBeLessThanOrEqual(10);

        const veryHigh = calculatePriceScore(50000, 10000, 12000);
        expect(veryHigh.score).toBeGreaterThanOrEqual(1);
    });
});

describe('calculateOverallScore', () => {
    it('calculates weighted average correctly', () => {
        const result = calculateOverallScore(10, 10, 10, []);
        expect(result.score).toBe(10);
        expect(result.recommendation).toBe('BUY');
    });

    it('returns BUY for high scores', () => {
        const result = calculateOverallScore(8, 8, 8, []);
        expect(result.score).toBeGreaterThanOrEqual(7.5);
        expect(result.recommendation).toBe('BUY');
    });

    it('returns MAYBE for medium scores', () => {
        const result = calculateOverallScore(6, 6, 6, []);
        expect(result.score).toBeGreaterThanOrEqual(5);
        expect(result.score).toBeLessThan(7.5);
        expect(result.recommendation).toBe('MAYBE');
    });

    it('returns PASS for low scores', () => {
        const result = calculateOverallScore(3, 3, 3, []);
        expect(result.score).toBeLessThan(5);
        expect(result.recommendation).toBe('PASS');
    });

    it('penalizes for red flags', () => {
        const noFlags = calculateOverallScore(8, 8, 8, []);
        const withFlags = calculateOverallScore(8, 8, 8, [
            { severity: 'medium' },
            { severity: 'low' },
        ]);
        expect(withFlags.score).toBeLessThan(noFlags.score);
    });

    it('returns PASS for critical red flags regardless of score', () => {
        const result = calculateOverallScore(10, 10, 10, [
            { severity: 'critical' },
        ]);
        expect(result.recommendation).toBe('PASS');
    });

    it('applies high red flag penalty', () => {
        const noFlags = calculateOverallScore(8, 8, 8, []);
        const highFlag = calculateOverallScore(8, 8, 8, [
            { severity: 'high' },
        ]);
        expect(highFlag.score).toBeLessThan(noFlags.score);
        expect(noFlags.score - highFlag.score).toBeGreaterThanOrEqual(1);
    });

    it('generates appropriate summary', () => {
        const buy = calculateOverallScore(9, 9, 9, []);
        expect(buy.summary).toContain('BUY');
        expect(buy.summary).toContain('Reliability');

        const pass = calculateOverallScore(2, 2, 2, []);
        expect(pass.summary).toContain('Pass');
    });

    it('sets confidence based on data completeness', () => {
        // All scores !== 5 means complete data
        const complete = calculateOverallScore(8, 7, 9, []);
        expect(complete.confidence).toBe(0.85);

        // Any score === 5 means incomplete data (default values)
        const incomplete = calculateOverallScore(5, 7, 9, []);
        expect(incomplete.confidence).toBe(0.65);
    });

    it('handles edge case: NaN inputs', () => {
        const result = calculateOverallScore(NaN, 8, 8, []);
        expect(result.score).toBeGreaterThanOrEqual(1);
        expect(result.score).toBeLessThanOrEqual(10);
    });

    it('clamps input scores to 1-10 range', () => {
        const result = calculateOverallScore(15, -5, 100, []);
        expect(result.score).toBeGreaterThanOrEqual(1);
        expect(result.score).toBeLessThanOrEqual(10);
    });

    it('handles empty red flags array', () => {
        const result = calculateOverallScore(7, 7, 7, []);
        expect(result.score).toBe(7);
    });

    it('handles multiple red flags of same severity', () => {
        const result = calculateOverallScore(10, 10, 10, [
            { severity: 'medium' },
            { severity: 'medium' },
            { severity: 'medium' },
        ]);
        // 3 medium flags * 0.5 penalty each = 1.5 total penalty
        expect(result.score).toBe(8.5);
    });
});

import { describe, it, expect } from 'vitest';
import { estimateFairPrice, getMsrpData, getApproximateMsrp } from './pricing';

describe('getMsrpData', () => {
    it('returns correct data for known vehicle', () => {
        const data = getMsrpData('Toyota', 'Camry');
        expect(data.baseMsrp).toBe(28000);
        expect(data.category).toBe('midsize');
    });

    it('handles case-insensitive matching', () => {
        const data = getMsrpData('TOYOTA', 'CAMRY');
        expect(data.baseMsrp).toBe(28000);
    });

    it('returns default for unknown vehicle', () => {
        const data = getMsrpData('Unknown', 'Model');
        expect(data.baseMsrp).toBe(30000);
        expect(data.category).toBe('midsize');
    });

    it('handles partial model match', () => {
        const data = getMsrpData('Honda', 'Civic EX');
        expect(data.baseMsrp).toBe(25000);
        expect(data.category).toBe('economy');
    });

    it('returns correct category for trucks', () => {
        const data = getMsrpData('Ford', 'F-150');
        expect(data.category).toBe('truck');
    });

    it('returns correct category for luxury', () => {
        const data = getMsrpData('BMW', '3 Series');
        expect(data.category).toBe('luxury');
    });

    it('returns correct category for SUVs', () => {
        const data = getMsrpData('Toyota', 'RAV4');
        expect(data.category).toBe('suv');
    });
});

describe('getApproximateMsrp', () => {
    it('returns baseMsrp from getMsrpData', () => {
        const msrp = getApproximateMsrp('Honda', 'Accord');
        expect(msrp).toBe(29000);
    });
});

describe('estimateFairPrice', () => {
    it('returns price estimate with low, high, and midpoint', () => {
        const estimate = estimateFairPrice('Toyota', 'Camry', 2020, 50000);
        expect(estimate).toHaveProperty('low');
        expect(estimate).toHaveProperty('high');
        expect(estimate).toHaveProperty('midpoint');
        expect(estimate.low).toBeLessThan(estimate.midpoint);
        expect(estimate.midpoint).toBeLessThan(estimate.high);
    });

    it('depreciates value for older vehicles', () => {
        const newer = estimateFairPrice('Toyota', 'Camry', 2023, 30000);
        const older = estimateFairPrice('Toyota', 'Camry', 2015, 30000);
        expect(older.midpoint).toBeLessThan(newer.midpoint);
    });

    it('adjusts for high mileage', () => {
        const lowMiles = estimateFairPrice('Toyota', 'Camry', 2020, 30000);
        const highMiles = estimateFairPrice('Toyota', 'Camry', 2020, 150000);
        expect(highMiles.midpoint).toBeLessThan(lowMiles.midpoint);
    });

    it('adjusts for low mileage', () => {
        // For a 5-year-old car, expected mileage is ~60000
        const expectedMiles = estimateFairPrice('Toyota', 'Camry', 2020, 60000);
        const lowMiles = estimateFairPrice('Toyota', 'Camry', 2020, 20000);
        expect(lowMiles.midpoint).toBeGreaterThan(expectedMiles.midpoint);
    });

    it('applies brand retention multipliers', () => {
        // Toyota has higher retention (1.18) than Nissan (0.95)
        const toyota = estimateFairPrice('Toyota', 'Camry', 2018, 80000);
        const nissan = estimateFairPrice('Nissan', 'Altima', 2018, 80000);
        // Even with different MSRPs, Toyota should retain better
        expect(toyota.midpoint / 28000).toBeGreaterThan(nissan.midpoint / 27000);
    });

    it('respects minimum value floor', () => {
        // Very old, high mileage car
        const estimate = estimateFairPrice('Unknown', 'Model', 1990, 300000);
        expect(estimate.low).toBeGreaterThanOrEqual(2000);
        expect(estimate.high).toBeGreaterThanOrEqual(2500);
    });

    it('handles current year vehicle', () => {
        const currentYear = new Date().getFullYear();
        const estimate = estimateFairPrice('Toyota', 'Camry', currentYear, 5000);
        // Should be close to MSRP with slight adjustment
        expect(estimate.midpoint).toBeGreaterThan(20000);
    });

    it('handles future year vehicle', () => {
        const futureYear = new Date().getFullYear() + 1;
        const estimate = estimateFairPrice('Toyota', 'Camry', futureYear, 0);
        // Age would be -1, but should handle gracefully
        expect(estimate.midpoint).toBeGreaterThan(0);
    });

    it('caps depreciation for very old vehicles', () => {
        // 50+ year old car should hit category floor
        const estimate1 = estimateFairPrice('Toyota', 'Camry', 1970, 100000);
        const estimate2 = estimateFairPrice('Toyota', 'Camry', 1960, 100000);
        // Both should be at floor, so similar values
        expect(Math.abs(estimate1.midpoint - estimate2.midpoint)).toBeLessThan(1000);
    });

    it('handles edge case: zero mileage', () => {
        const estimate = estimateFairPrice('Toyota', 'Camry', 2020, 0);
        expect(estimate.midpoint).toBeGreaterThan(0);
    });

    it('handles edge case: very high mileage', () => {
        const estimate = estimateFairPrice('Toyota', 'Camry', 2020, 500000);
        expect(estimate.low).toBeGreaterThanOrEqual(2000);
    });

    it('calculates range correctly (low < mid < high)', () => {
        const estimate = estimateFairPrice('Honda', 'Civic', 2019, 45000);
        expect(estimate.low).toBeLessThan(estimate.midpoint);
        expect(estimate.midpoint).toBeLessThan(estimate.high);
        // Range should be approximately +/- 8% of midpoint
        const expectedLow = estimate.midpoint * 0.92;
        const expectedHigh = estimate.midpoint * 1.08;
        expect(estimate.low).toBeCloseTo(expectedLow, -2); // Within 100s
        expect(estimate.high).toBeCloseTo(expectedHigh, -2);
    });

    it('luxury cars depreciate faster', () => {
        const luxuryRetention = estimateFairPrice('BMW', '3 Series', 2018, 50000);
        const economyRetention = estimateFairPrice('Toyota', 'Corolla', 2018, 50000);

        // Calculate retention percentage
        const luxuryPct = luxuryRetention.midpoint / 45000; // BMW MSRP
        const economyPct = economyRetention.midpoint / 22000; // Corolla MSRP

        expect(economyPct).toBeGreaterThan(luxuryPct);
    });

    it('trucks hold value well', () => {
        const truck = estimateFairPrice('Ford', 'F-150', 2018, 60000);
        const sedan = estimateFairPrice('Ford', 'Fusion', 2018, 60000);

        // Trucks and sedans both have Ford's 1.0 brand multiplier
        // Truck value floor is 20%, sedan (midsize) is 12%
        // Both are same age/mileage, so we can compare absolute values
        // The truck should have higher absolute value due to higher MSRP and floor
        expect(truck.midpoint).toBeGreaterThan(sedan.midpoint);
    });
});

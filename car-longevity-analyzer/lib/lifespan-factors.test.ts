import { describe, it, expect } from 'vitest';
import {
    calculateAdjustedLifespan,
    ownerCountToHistory,
    type LifespanFactors,
} from './lifespan-factors';

describe('calculateAdjustedLifespan', () => {
    const BASE_LIFESPAN = 200000;

    describe('unknown/empty factors', () => {
        it('returns base lifespan unchanged when all factors are unknown', () => {
            const factors: LifespanFactors = {
                transmission: 'unknown',
                drivetrain: 'unknown',
                engine: 'unknown',
                maintenance: 'unknown',
                drivingConditions: 'unknown',
                climate: 'unknown',
                accidentHistory: 'unknown',
                ownerCount: 'unknown',
            };

            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.adjustedLifespan).toBe(BASE_LIFESPAN);
            expect(result.totalMultiplier).toBe(1);
            expect(result.appliedFactors).toHaveLength(0);
            expect(result.confidence).toBe('low');
        });

        it('returns base lifespan unchanged when factors object is empty', () => {
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, {});

            expect(result.adjustedLifespan).toBe(BASE_LIFESPAN);
            expect(result.totalMultiplier).toBe(1);
            expect(result.appliedFactors).toHaveLength(0);
        });
    });

    describe('individual factor multipliers', () => {
        it('applies manual transmission bonus (+8%)', () => {
            const factors: LifespanFactors = { transmission: 'manual' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(1.08);
            expect(result.adjustedLifespan).toBe(216000);
            expect(result.appliedFactors[0].impact).toBe('positive');
        });

        it('applies CVT penalty (-15%)', () => {
            const factors: LifespanFactors = { transmission: 'cvt' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(0.85);
            expect(result.adjustedLifespan).toBe(170000);
            expect(result.appliedFactors[0].impact).toBe('negative');
        });

        it('applies electric engine bonus (+20%)', () => {
            const factors: LifespanFactors = { engine: 'electric' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(1.2);
            expect(result.adjustedLifespan).toBe(240000);
        });

        it('applies supercharged engine penalty (-10%)', () => {
            const factors: LifespanFactors = { engine: 'supercharged' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(0.9);
            expect(result.adjustedLifespan).toBe(180000);
        });

        it('applies excellent maintenance bonus (+15%)', () => {
            const factors: LifespanFactors = { maintenance: 'excellent' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(1.15);
            expect(result.adjustedLifespan).toBe(230000);
        });

        it('applies poor maintenance penalty (-20%)', () => {
            const factors: LifespanFactors = { maintenance: 'poor' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(0.8);
            expect(result.adjustedLifespan).toBe(160000);
        });

        it('applies highway driving bonus (+10%)', () => {
            const factors: LifespanFactors = { drivingConditions: 'highway_primary' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(1.1);
            expect(result.adjustedLifespan).toBe(220000);
        });

        it('applies severe driving penalty (-20%)', () => {
            const factors: LifespanFactors = { drivingConditions: 'severe' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(0.8);
            expect(result.adjustedLifespan).toBe(160000);
        });

        it('applies rust belt climate penalty (-15%)', () => {
            const factors: LifespanFactors = { climate: 'rust_belt' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(0.85);
            expect(result.adjustedLifespan).toBe(170000);
        });

        it('applies moderate climate bonus (+5%)', () => {
            const factors: LifespanFactors = { climate: 'moderate' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(1.05);
            expect(result.adjustedLifespan).toBe(210000);
        });

        it('applies no accidents bonus (+5%)', () => {
            const factors: LifespanFactors = { accidentHistory: 'none' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(1.05);
            expect(result.adjustedLifespan).toBe(210000);
        });

        it('applies severe accident penalty (-30%)', () => {
            const factors: LifespanFactors = { accidentHistory: 'severe' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(0.7);
            expect(result.adjustedLifespan).toBe(140000);
        });

        it('applies single owner bonus (+8%)', () => {
            const factors: LifespanFactors = { ownerCount: 'single_owner' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(1.08);
            expect(result.adjustedLifespan).toBe(216000);
        });

        it('applies multiple owners penalty (-5%)', () => {
            const factors: LifespanFactors = { ownerCount: 'multiple_owners' };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.totalMultiplier).toBe(0.95);
            expect(result.adjustedLifespan).toBe(190000);
        });
    });

    describe('combined factors', () => {
        it('combines multiple positive factors', () => {
            const factors: LifespanFactors = {
                transmission: 'manual',   // +8%
                engine: 'electric',       // +20%
                maintenance: 'excellent', // +15%
            };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            // 1.08 * 1.20 * 1.15 = 1.4904
            expect(result.totalMultiplier).toBeCloseTo(1.49, 2);
            expect(result.appliedFactors).toHaveLength(3);
            expect(result.confidence).toBe('medium');
        });

        it('combines multiple negative factors', () => {
            const factors: LifespanFactors = {
                transmission: 'cvt',           // -15%
                maintenance: 'poor',           // -20%
                climate: 'rust_belt',          // -15%
                accidentHistory: 'severe',     // -30%
            };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            // 0.85 * 0.80 * 0.85 * 0.70 = 0.4046
            // Clamped to 0.5 minimum
            expect(result.totalMultiplier).toBe(0.5);
            expect(result.adjustedLifespan).toBe(100000);
        });

        it('combines mixed positive and negative factors', () => {
            const factors: LifespanFactors = {
                engine: 'hybrid',                  // +10%
                drivingConditions: 'highway_primary', // +10%
                climate: 'extreme_heat',           // -8%
                ownerCount: 'two_owners',          // baseline 1.0
            };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            // 1.10 * 1.10 * 0.92 * 1.0 = 1.1132
            expect(result.totalMultiplier).toBeCloseTo(1.113, 2);
            expect(result.appliedFactors).toHaveLength(4); // includes two_owners as neutral impact

            const ownerFactor = result.appliedFactors.find(f => f.category === 'Ownership History');
            expect(ownerFactor?.impact).toBe('neutral');
        });
    });

    describe('clamping at extremes', () => {
        it('clamps to minimum 0.5 multiplier (50% of base)', () => {
            const factors: LifespanFactors = {
                transmission: 'cvt',           // 0.85
                engine: 'supercharged',        // 0.90
                maintenance: 'poor',           // 0.80
                drivingConditions: 'severe',   // 0.80
                climate: 'rust_belt',          // 0.85
                accidentHistory: 'severe',     // 0.70
                ownerCount: 'multiple_owners', // 0.95
            };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            // Calculated: 0.85 * 0.90 * 0.80 * 0.80 * 0.85 * 0.70 * 0.95 = 0.247
            // Clamped to 0.5
            expect(result.totalMultiplier).toBe(0.5);
            expect(result.adjustedLifespan).toBe(100000);
        });

        it('clamps to maximum 1.5 multiplier (150% of base)', () => {
            const factors: LifespanFactors = {
                transmission: 'manual',            // 1.08
                engine: 'electric',                // 1.20
                maintenance: 'excellent',          // 1.15
                drivingConditions: 'highway_primary', // 1.10
                climate: 'moderate',               // 1.05
                accidentHistory: 'none',           // 1.05
                ownerCount: 'single_owner',        // 1.08
            };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            // Calculated: 1.08 * 1.20 * 1.15 * 1.10 * 1.05 * 1.05 * 1.08 = 1.917
            // Clamped to 1.5
            expect(result.totalMultiplier).toBe(1.5);
            expect(result.adjustedLifespan).toBe(300000);
        });
    });

    describe('confidence levels', () => {
        it('returns low confidence with 0-1 known factors', () => {
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, {});
            expect(result.confidence).toBe('low');

            const result2 = calculateAdjustedLifespan(BASE_LIFESPAN, { transmission: 'manual' });
            expect(result2.confidence).toBe('low');
        });

        it('returns medium confidence with 2-4 known factors', () => {
            const factors: LifespanFactors = {
                transmission: 'manual',
                maintenance: 'good',
            };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);
            expect(result.confidence).toBe('medium');

            const factors4: LifespanFactors = {
                transmission: 'manual',
                maintenance: 'good',
                climate: 'moderate',
                ownerCount: 'single_owner',
            };
            const result4 = calculateAdjustedLifespan(BASE_LIFESPAN, factors4);
            expect(result4.confidence).toBe('medium');
        });

        it('returns high confidence with 5+ known factors', () => {
            const factors: LifespanFactors = {
                transmission: 'automatic',
                drivetrain: 'fwd',
                engine: 'naturally_aspirated',
                maintenance: 'good',
                climate: 'moderate',
            };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);
            expect(result.confidence).toBe('high');
        });
    });

    describe('applied factors list', () => {
        it('includes detailed information for each applied factor', () => {
            const factors: LifespanFactors = {
                transmission: 'cvt',
                maintenance: 'excellent',
            };
            const result = calculateAdjustedLifespan(BASE_LIFESPAN, factors);

            expect(result.appliedFactors).toHaveLength(2);

            const transmissionFactor = result.appliedFactors.find(f => f.category === 'Transmission Type');
            expect(transmissionFactor).toBeDefined();
            expect(transmissionFactor?.value).toBe('CVT');
            expect(transmissionFactor?.multiplier).toBe(0.85);
            expect(transmissionFactor?.impact).toBe('negative');

            const maintenanceFactor = result.appliedFactors.find(f => f.category === 'Maintenance Quality');
            expect(maintenanceFactor).toBeDefined();
            expect(maintenanceFactor?.value).toBe('Excellent');
            expect(maintenanceFactor?.multiplier).toBe(1.15);
            expect(maintenanceFactor?.impact).toBe('positive');
        });
    });
});

describe('ownerCountToHistory', () => {
    it('returns single_owner for count of 1', () => {
        expect(ownerCountToHistory(1)).toBe('single_owner');
    });

    it('returns two_owners for count of 2', () => {
        expect(ownerCountToHistory(2)).toBe('two_owners');
    });

    it('returns multiple_owners for count of 3 or more', () => {
        expect(ownerCountToHistory(3)).toBe('multiple_owners');
        expect(ownerCountToHistory(5)).toBe('multiple_owners');
        expect(ownerCountToHistory(10)).toBe('multiple_owners');
    });

    it('returns unknown for null/undefined/0', () => {
        expect(ownerCountToHistory(null)).toBe('unknown');
        expect(ownerCountToHistory(0)).toBe('unknown');
    });
});

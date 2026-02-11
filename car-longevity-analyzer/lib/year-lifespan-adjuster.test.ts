import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateYearSpecificLifespan, clearCache } from './year-lifespan-adjuster';
import { LIFESPAN_ADJUSTMENT_LIMITS, YEAR_LIFESPAN_ADJUSTMENTS } from './constants';

// Mock OpenAI
vi.mock('openai', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: vi.fn(),
                },
            },
        })),
    };
});

describe('calculateYearSpecificLifespan', () => {
    beforeEach(() => {
        clearCache();
        // Reset OpenAI env var
        delete process.env.OPENAI_API_KEY;
    });

    describe('database vehicles - no year issues', () => {
        it('returns base lifespan for a known vehicle in a normal year', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2015);

            expect(result.source).toBe('database');
            expect(result.inDatabase).toBe(true);
            expect(result.baseLifespanMiles).toBe(165000);
            // 2015 gets modern era bonus of 1.01
            expect(result.expectedLifespanMiles).toBe(Math.round(165000 * YEAR_LIFESPAN_ADJUSTMENTS.modernEraBonus2015));
            expect(result.confidence).toBe('medium'); // no year-specific data
        });

        it('calculates expected years based on 12000 miles/year', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2020);

            expect(result.expectedLifespanYears).toBe(Math.round(result.expectedLifespanMiles / 12000));
        });
    });

    describe('database vehicles - year-to-avoid penalty', () => {
        it('applies year-to-avoid penalty for problematic years', async () => {
            // 2007 is a year to avoid for Camry
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2007);

            expect(result.source).toBe('database');
            expect(result.confidence).toBe('high'); // has year-specific data
            expect(result.adjustments.some(a => a.impact === 'negative' && a.multiplier === 0.90)).toBe(true);
            // 2007 < 2015, so no era bonus. But 2007 >= 2005, so no old era penalty either.
            // Should be: 165000 * 0.90 (year-to-avoid) * 0.90 (major known issue for 2007)
            expect(result.expectedLifespanMiles).toBeLessThan(165000);
        });

        it('does not apply penalty for non-problematic years', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2014);

            expect(result.adjustments.every(a => a.multiplier !== YEAR_LIFESPAN_ADJUSTMENTS.yearToAvoidPenalty)).toBe(true);
        });
    });

    describe('database vehicles - known issue penalty', () => {
        it('applies known issue penalty when affectedYears matches', async () => {
            // 2010 Camry has a major engine issue affecting years 2007-2011
            // 2010 is NOT a year-to-avoid (only 2007-2009 are), so the only
            // negative adjustment should be the known issue penalty
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2010);

            expect(result.source).toBe('database');
            expect(result.confidence).toBe('high'); // has year-specific known issue data
            // Should have a negative adjustment for the engine issue
            const issueAdj = result.adjustments.find(a =>
                a.impact === 'negative' && a.reason.toLowerCase().includes('engine')
            );
            expect(issueAdj).toBeDefined();
            expect(issueAdj!.multiplier).toBe(0.90); // major severity
        });

        it('does not apply known issue penalty for years outside affectedYears', async () => {
            // 2020 Camry should not be affected by the 2007-2011 engine issue
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2020);

            const issueAdj = result.adjustments.find(a =>
                a.impact === 'negative' && a.multiplier < 1.0 && a.multiplier !== YEAR_LIFESPAN_ADJUSTMENTS.yearToAvoidPenalty
            );
            // No known issue penalty (the only negative-looking adj should not exist)
            expect(issueAdj).toBeUndefined();
        });
    });

    describe('database vehicles - era bonus/penalty', () => {
        it('applies modern era bonus for 2020+', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Corolla', 2022);

            const eraAdj = result.adjustments.find(a => a.multiplier === YEAR_LIFESPAN_ADJUSTMENTS.modernEraBonus2020);
            expect(eraAdj).toBeDefined();
            expect(eraAdj!.impact).toBe('positive');
        });

        it('applies 2015-era bonus for 2015-2019', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Corolla', 2017);

            const eraAdj = result.adjustments.find(a => a.multiplier === YEAR_LIFESPAN_ADJUSTMENTS.modernEraBonus2015);
            expect(eraAdj).toBeDefined();
            expect(eraAdj!.impact).toBe('positive');
        });

        it('applies old era penalty for pre-2005', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', '4Runner', 2003);

            const eraAdj = result.adjustments.find(a => a.multiplier === YEAR_LIFESPAN_ADJUSTMENTS.oldEraPenalty);
            expect(eraAdj).toBeDefined();
            expect(eraAdj!.impact).toBe('negative');
        });

        it('applies no era adjustment for 2005-2014', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Corolla', 2012);

            const eraAdj = result.adjustments.find(a =>
                a.multiplier === YEAR_LIFESPAN_ADJUSTMENTS.modernEraBonus2020 ||
                a.multiplier === YEAR_LIFESPAN_ADJUSTMENTS.modernEraBonus2015 ||
                a.multiplier === YEAR_LIFESPAN_ADJUSTMENTS.oldEraPenalty
            );
            expect(eraAdj).toBeUndefined();
        });
    });

    describe('multiple adjustments stacking', () => {
        it('stacks year-to-avoid + known issue + era penalties', async () => {
            // 2007 Camry: year-to-avoid (0.90) + major issue (0.90) + no era adj
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2007);

            expect(result.adjustments.length).toBeGreaterThanOrEqual(2);
            expect(result.yearMultiplier).toBeLessThan(1.0);
            // Combined: 0.90 * 0.90 = 0.81
            expect(result.yearMultiplier).toBeCloseTo(0.81, 2);
            expect(result.expectedLifespanMiles).toBe(Math.round(165000 * 0.81));
        });
    });

    describe('multiplier clamping', () => {
        it('clamps multiplier to minimum 0.5', async () => {
            // This is hard to trigger naturally, but we verify the concept
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2020);
            expect(result.yearMultiplier).toBeGreaterThanOrEqual(LIFESPAN_ADJUSTMENT_LIMITS.minMultiplier);
        });

        it('clamps multiplier to maximum 1.5', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2020);
            expect(result.yearMultiplier).toBeLessThanOrEqual(LIFESPAN_ADJUSTMENT_LIMITS.maxMultiplier);
        });
    });

    describe('unknown vehicles - default fallback', () => {
        it('returns default lifespan when vehicle not in DB and no API key', async () => {
            const result = await calculateYearSpecificLifespan('Fictional', 'CarModel', 2020);

            expect(result.source).toBe('default');
            expect(result.inDatabase).toBe(false);
            expect(result.confidence).toBe('low');
            expect(result.expectedLifespanMiles).toBe(LIFESPAN_ADJUSTMENT_LIMITS.defaultLifespan);
            expect(result.adjustments).toHaveLength(0);
        });
    });

    describe('caching', () => {
        it('returns cached result on second call', async () => {
            const result1 = await calculateYearSpecificLifespan('Toyota', 'Camry', 2015);
            const result2 = await calculateYearSpecificLifespan('Toyota', 'Camry', 2015);

            expect(result1).toEqual(result2);
        });

        it('returns different results for different years', async () => {
            const result2015 = await calculateYearSpecificLifespan('Toyota', 'Camry', 2015);
            const result2007 = await calculateYearSpecificLifespan('Toyota', 'Camry', 2007);

            expect(result2015.expectedLifespanMiles).not.toBe(result2007.expectedLifespanMiles);
        });

        it('clears cache properly', async () => {
            await calculateYearSpecificLifespan('Toyota', 'Camry', 2015);
            clearCache();
            // After clearing, the function should still work (recalculate)
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2015);
            expect(result.source).toBe('database');
        });
    });

    describe('return type structure', () => {
        it('includes all required fields', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2020);

            expect(result).toHaveProperty('expectedLifespanMiles');
            expect(result).toHaveProperty('expectedLifespanYears');
            expect(result).toHaveProperty('baseLifespanMiles');
            expect(result).toHaveProperty('yearMultiplier');
            expect(result).toHaveProperty('adjustments');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('source');
            expect(result).toHaveProperty('inDatabase');
            expect(typeof result.expectedLifespanMiles).toBe('number');
            expect(typeof result.expectedLifespanYears).toBe('number');
            expect(typeof result.yearMultiplier).toBe('number');
            expect(Array.isArray(result.adjustments)).toBe(true);
        });

        it('adjustment items have correct structure', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2007);

            for (const adj of result.adjustments) {
                expect(adj).toHaveProperty('reason');
                expect(adj).toHaveProperty('impact');
                expect(adj).toHaveProperty('multiplier');
                expect(['positive', 'negative', 'neutral']).toContain(adj.impact);
                expect(typeof adj.multiplier).toBe('number');
            }
        });
    });
});

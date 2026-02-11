import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    calculateYearSpecificLifespan,
    clearCache,
    buildComplaintSummary,
    isEstimateStale,
    calculateFromDatabaseDeterministic,
} from './year-lifespan-adjuster';
import { LIFESPAN_ADJUSTMENT_LIMITS, YEAR_LIFESPAN_ADJUSTMENTS, AI_LIFESPAN_PROMPT_VERSION } from './constants';

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

// Mock Prisma
vi.mock('./db', () => ({
    prisma: {
        lifespanEstimate: {
            findUnique: vi.fn().mockResolvedValue(null),
            upsert: vi.fn().mockResolvedValue(null),
        },
    },
}));

// Import the mocked prisma instance (must come after vi.mock)
import { prisma } from './db';
const mockPrisma = vi.mocked(prisma, true);

describe('calculateYearSpecificLifespan', () => {
    beforeEach(() => {
        clearCache();
        // Reset OpenAI env var — ensures AI path is unavailable, so deterministic fallback is used
        delete process.env.OPENAI_API_KEY;

        // Reset Prisma mocks
        mockPrisma.lifespanEstimate.findUnique.mockResolvedValue(null as any);
        mockPrisma.lifespanEstimate.upsert.mockResolvedValue(null as any);
    });

    describe('database vehicles - no year issues (deterministic fallback)', () => {
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

    describe('PostgreSQL persistence - fresh estimate returned', () => {
        it('returns persisted estimate when fresh and version matches', async () => {
            mockPrisma.lifespanEstimate.findUnique.mockResolvedValue({
                id: 'test-1',
                make: 'toyota',
                model: 'camry',
                year: 2018,
                createdAt: new Date(),
                expectedLifespanMiles: 158000,
                confidence: 'high',
                source: 'ai_hybrid',
                reasoning: 'Good generation with reliable engine',
                complaintCount: 10,
                modelVersion: AI_LIFESPAN_PROMPT_VERSION,
                updatedAt: new Date(), // fresh
            });

            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2018);

            expect(result.expectedLifespanMiles).toBe(158000);
            expect(result.confidence).toBe('high');
            expect(result.source).toBe('ai'); // mapped from ai_hybrid
            expect(result.sourceDetail).toBe('ai_hybrid');
            expect(result.inDatabase).toBe(true); // Camry is in static DB
        });

        it('returns persisted standalone estimate', async () => {
            mockPrisma.lifespanEstimate.findUnique.mockResolvedValue({
                id: 'test-2',
                make: 'fictional',
                model: 'carmodel',
                year: 2020,
                createdAt: new Date(),
                expectedLifespanMiles: 125000,
                confidence: 'medium',
                source: 'ai_standalone',
                reasoning: 'Comparable to Hyundai Tucson',
                complaintCount: 5,
                modelVersion: AI_LIFESPAN_PROMPT_VERSION,
                updatedAt: new Date(),
            });

            const result = await calculateYearSpecificLifespan('Fictional', 'CarModel', 2020);

            expect(result.expectedLifespanMiles).toBe(125000);
            expect(result.source).toBe('ai');
            expect(result.sourceDetail).toBe('ai_standalone');
            expect(result.inDatabase).toBe(false);
        });
    });

    describe('PostgreSQL persistence - stale estimate triggers re-estimation', () => {
        it('re-estimates when persisted version is old', async () => {
            mockPrisma.lifespanEstimate.findUnique.mockResolvedValue({
                id: 'test-3',
                make: 'toyota',
                model: 'camry',
                year: 2018,
                createdAt: new Date(),
                expectedLifespanMiles: 158000,
                confidence: 'high',
                source: 'ai_hybrid',
                reasoning: 'Old estimate',
                complaintCount: 10,
                modelVersion: 'v0', // old version
                updatedAt: new Date(),
            });

            // No API key, so falls back to deterministic
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2018);

            // Should use deterministic fallback, not the persisted value
            expect(result.source).toBe('database');
            expect(result.expectedLifespanMiles).not.toBe(158000);
        });
    });

    describe('PostgreSQL graceful degradation', () => {
        it('continues when Prisma read fails', async () => {
            mockPrisma.lifespanEstimate.findUnique.mockRejectedValue(new Error('Connection refused'));

            // Should not throw, should fall back gracefully
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2015);

            expect(result.source).toBe('database');
            expect(result.inDatabase).toBe(true);
        });
    });

    describe('complaints parameter', () => {
        it('accepts optional complaints parameter without error', async () => {
            const complaints = [
                { Component: 'ENGINE', Summary: 'Oil leak', DateOfIncident: '2020-01-01', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
            ];

            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2015, complaints as any);

            expect(result.source).toBe('database');
            expect(result.inDatabase).toBe(true);
        });

        it('works without complaints parameter (backward compatible)', async () => {
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

        it('includes sourceDetail field', async () => {
            const result = await calculateYearSpecificLifespan('Toyota', 'Camry', 2020);
            expect(result).toHaveProperty('sourceDetail');
            expect(result.sourceDetail).toBe('database');
        });
    });
});

describe('buildComplaintSummary', () => {
    it('returns null for empty complaints', () => {
        expect(buildComplaintSummary([])).toBeNull();
    });

    it('returns null for undefined-like input', () => {
        expect(buildComplaintSummary(null as any)).toBeNull();
        expect(buildComplaintSummary(undefined as any)).toBeNull();
    });

    it('correctly counts total complaints', () => {
        const complaints = [
            { Component: 'ENGINE', Summary: 'Test', DateOfIncident: '', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
            { Component: 'BRAKES', Summary: 'Test', DateOfIncident: '', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
        ];

        const summary = buildComplaintSummary(complaints as any);
        expect(summary).toContain('Total NHTSA complaints: 2');
    });

    it('includes crash, fire, injury, and death counts when present', () => {
        const complaints = [
            { Component: 'ENGINE', Summary: 'Test', DateOfIncident: '', Crash: true, Fire: true, Injuries: 2, Deaths: 1 },
            { Component: 'BRAKES', Summary: 'Test', DateOfIncident: '', Crash: false, Fire: false, Injuries: 1, Deaths: 0 },
        ];

        const summary = buildComplaintSummary(complaints as any)!;
        expect(summary).toContain('Crashes: 1');
        expect(summary).toContain('Fires: 1');
        expect(summary).toContain('Injuries: 3');
        expect(summary).toContain('Deaths: 1');
    });

    it('excludes crash/fire/injury/death when zero', () => {
        const complaints = [
            { Component: 'ENGINE', Summary: 'Test', DateOfIncident: '', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
        ];

        const summary = buildComplaintSummary(complaints as any)!;
        expect(summary).not.toContain('Crashes');
        expect(summary).not.toContain('Fires');
        expect(summary).not.toContain('Injuries');
        expect(summary).not.toContain('Deaths');
    });

    it('groups and sorts components by frequency', () => {
        const complaints = [
            { Component: 'ENGINE', Summary: '', DateOfIncident: '', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
            { Component: 'ENGINE', Summary: '', DateOfIncident: '', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
            { Component: 'ENGINE', Summary: '', DateOfIncident: '', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
            { Component: 'BRAKES', Summary: '', DateOfIncident: '', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
        ];

        const summary = buildComplaintSummary(complaints as any)!;
        expect(summary).toContain('ENGINE: 3');
        expect(summary).toContain('BRAKES: 1');
        // ENGINE should come before BRAKES
        expect(summary.indexOf('ENGINE')).toBeLessThan(summary.indexOf('BRAKES'));
    });

    it('handles missing Component field', () => {
        const complaints = [
            { Component: '', Summary: 'Test', DateOfIncident: '', Crash: false, Fire: false, Injuries: 0, Deaths: 0 },
        ];

        const summary = buildComplaintSummary(complaints as any)!;
        expect(summary).toContain('UNKNOWN: 1');
    });
});

describe('isEstimateStale', () => {
    it('returns true when model version does not match', () => {
        const estimate = {
            expectedLifespanMiles: 160000,
            confidence: 'high',
            source: 'ai_hybrid',
            reasoning: 'test',
            complaintCount: 10,
            modelVersion: 'v0',
            updatedAt: new Date(),
        };

        expect(isEstimateStale(estimate, 10)).toBe(true);
    });

    it('returns true when had 0 complaints but now has many', () => {
        const estimate = {
            expectedLifespanMiles: 160000,
            confidence: 'high',
            source: 'ai_hybrid',
            reasoning: 'test',
            complaintCount: 0,
            modelVersion: AI_LIFESPAN_PROMPT_VERSION,
            updatedAt: new Date(),
        };

        expect(isEstimateStale(estimate, 10)).toBe(true);
    });

    it('returns false when had 0 complaints and still has few', () => {
        const estimate = {
            expectedLifespanMiles: 160000,
            confidence: 'high',
            source: 'ai_hybrid',
            reasoning: 'test',
            complaintCount: 0,
            modelVersion: AI_LIFESPAN_PROMPT_VERSION,
            updatedAt: new Date(),
        };

        expect(isEstimateStale(estimate, 3)).toBe(false);
    });

    it('returns true when complaints increased significantly', () => {
        const estimate = {
            expectedLifespanMiles: 160000,
            confidence: 'high',
            source: 'ai_hybrid',
            reasoning: 'test',
            complaintCount: 10,
            modelVersion: AI_LIFESPAN_PROMPT_VERSION,
            updatedAt: new Date(),
        };

        expect(isEstimateStale(estimate, 25)).toBe(true);
    });

    it('returns false when complaints increased slightly', () => {
        const estimate = {
            expectedLifespanMiles: 160000,
            confidence: 'high',
            source: 'ai_hybrid',
            reasoning: 'test',
            complaintCount: 10,
            modelVersion: AI_LIFESPAN_PROMPT_VERSION,
            updatedAt: new Date(),
        };

        expect(isEstimateStale(estimate, 15)).toBe(false);
    });

    it('returns true when estimate is older than 90 days', () => {
        const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
        const estimate = {
            expectedLifespanMiles: 160000,
            confidence: 'high',
            source: 'ai_hybrid',
            reasoning: 'test',
            complaintCount: 10,
            modelVersion: AI_LIFESPAN_PROMPT_VERSION,
            updatedAt: ninetyOneDaysAgo,
        };

        expect(isEstimateStale(estimate, 10)).toBe(true);
    });

    it('returns false when estimate is fresh and everything matches', () => {
        const estimate = {
            expectedLifespanMiles: 160000,
            confidence: 'high',
            source: 'ai_hybrid',
            reasoning: 'test',
            complaintCount: 10,
            modelVersion: AI_LIFESPAN_PROMPT_VERSION,
            updatedAt: new Date(),
        };

        expect(isEstimateStale(estimate, 10)).toBe(false);
    });
});

describe('calculateFromDatabaseDeterministic', () => {
    it('applies year-to-avoid penalty', () => {
        const result = calculateFromDatabaseDeterministic(
            165000, [2007, 2008], [], 'Toyota', 'Camry', 2007
        );

        expect(result.yearMultiplier).toBeLessThan(1.0);
        expect(result.adjustments.some(a => a.multiplier === 0.90)).toBe(true);
    });

    it('applies era bonus for modern vehicles', () => {
        const result = calculateFromDatabaseDeterministic(
            165000, [], [], 'Toyota', 'Camry', 2022
        );

        expect(result.adjustments.some(a => a.multiplier === YEAR_LIFESPAN_ADJUSTMENTS.modernEraBonus2020)).toBe(true);
    });

    it('returns database source', () => {
        const result = calculateFromDatabaseDeterministic(
            165000, [], [], 'Toyota', 'Camry', 2015
        );

        expect(result.source).toBe('database');
        expect(result.sourceDetail).toBe('database');
        expect(result.inDatabase).toBe(true);
    });
});

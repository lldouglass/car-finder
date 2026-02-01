import { describe, it, expect } from 'vitest';
import {
    calculateSurvivalProbabilities,
    weibullConditionalSurvival,
    calculateShapeParameter,
    type SurvivalInput,
} from './survival-model';
import type { LifespanFactors } from './lifespan-factors';

describe('weibullConditionalSurvival', () => {
    // Using lambda = 200000 (typical lifespan) and k = 3.2 (base shape parameter)
    const lambda = 200000;
    const k = 3.2;

    it('returns 1.0 for 0 additional miles', () => {
        const result = weibullConditionalSurvival(50000, 0, lambda, k);
        expect(result).toBe(1.0);
    });

    it('returns probability less than 1 for positive additional miles', () => {
        const result = weibullConditionalSurvival(50000, 50000, lambda, k);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(1);
    });

    it('returns lower probability for higher additional miles', () => {
        const prob50k = weibullConditionalSurvival(50000, 50000, lambda, k);
        const prob100k = weibullConditionalSurvival(50000, 100000, lambda, k);
        const prob150k = weibullConditionalSurvival(50000, 150000, lambda, k);

        expect(prob100k).toBeLessThan(prob50k);
        expect(prob150k).toBeLessThan(prob100k);
    });

    it('returns higher probability for lower current mileage (more life left)', () => {
        // At the same additional miles goal, a car with less current mileage should have better odds
        const probLowMileage = weibullConditionalSurvival(20000, 100000, lambda, k);
        const probHighMileage = weibullConditionalSurvival(100000, 100000, lambda, k);

        expect(probLowMileage).toBeGreaterThan(probHighMileage);
    });

    it('returns probability approaching 0 for very high additional miles', () => {
        const result = weibullConditionalSurvival(50000, 500000, lambda, k);
        expect(result).toBeLessThan(0.01);
    });

    it('handles vehicles already past expected lifespan', () => {
        // Vehicle at 220k with 200k expected lifespan
        const result = weibullConditionalSurvival(220000, 10000, lambda, k);
        // Should still return a valid probability (low but > 0)
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
    });
});

describe('calculateShapeParameter', () => {
    const baseInput: SurvivalInput = {
        currentMileage: 80000,
        vehicleAge: 5,
        adjustedLifespan: 200000,
        baseReliabilityScore: 7.5,
        knownIssues: [],
        factors: {},
        lifespanConfidence: 'medium',
    };

    it('returns base shape parameter for standard vehicle', () => {
        const k = calculateShapeParameter(baseInput);
        expect(k).toBeCloseTo(3.2, 1);  // Base is 3.2
    });

    it('decreases shape parameter for critical known issues', () => {
        const input: SurvivalInput = {
            ...baseInput,
            knownIssues: [{ severity: 'CRITICAL', component: 'engine' }],
        };
        const k = calculateShapeParameter(input);
        expect(k).toBeLessThan(3.2);  // Should be lower due to critical issue
        expect(k).toBeCloseTo(2.0, 1);  // Base 3.2 - 1.2 = 2.0
    });

    it('decreases shape parameter for major known issues', () => {
        const input: SurvivalInput = {
            ...baseInput,
            knownIssues: [{ severity: 'MAJOR', component: 'transmission' }],
        };
        const k = calculateShapeParameter(input);
        expect(k).toBeLessThan(3.2);
        expect(k).toBeCloseTo(2.7, 1);  // Base 3.2 - 0.5 = 2.7
    });

    it('increases shape parameter for high reliability score', () => {
        const input: SurvivalInput = {
            ...baseInput,
            baseReliabilityScore: 9.5,  // High reliability
        };
        const k = calculateShapeParameter(input);
        expect(k).toBeGreaterThan(3.2);
        expect(k).toBeCloseTo(3.7, 1);  // Base 3.2 + 0.5 = 3.7
    });

    it('decreases shape parameter for low reliability score', () => {
        const input: SurvivalInput = {
            ...baseInput,
            baseReliabilityScore: 5.0,  // Low reliability
        };
        const k = calculateShapeParameter(input);
        expect(k).toBeLessThan(3.2);
        expect(k).toBeCloseTo(2.9, 1);  // Base 3.2 - 0.3 = 2.9
    });

    it('decreases shape parameter for CVT transmission', () => {
        const factors: LifespanFactors = { transmission: 'cvt' };
        const input: SurvivalInput = {
            ...baseInput,
            factors,
        };
        const k = calculateShapeParameter(input);
        expect(k).toBeLessThan(3.2);
        expect(k).toBeCloseTo(3.0, 1);  // Base 3.2 - 0.2 = 3.0
    });

    it('decreases shape parameter for poor maintenance', () => {
        const factors: LifespanFactors = { maintenance: 'poor' };
        const input: SurvivalInput = {
            ...baseInput,
            factors,
        };
        const k = calculateShapeParameter(input);
        expect(k).toBeLessThan(3.2);
        expect(k).toBeCloseTo(2.9, 1);  // Base 3.2 - 0.3 = 2.9
    });

    it('increases shape parameter for survivor bias (old, low mileage)', () => {
        const input: SurvivalInput = {
            ...baseInput,
            vehicleAge: 18,
            currentMileage: 100000,  // Low for 18 years (expected ~216k)
        };
        const k = calculateShapeParameter(input);
        expect(k).toBeGreaterThan(3.2);
        expect(k).toBeCloseTo(3.5, 1);  // Base 3.2 + 0.3 = 3.5
    });

    it('clamps shape parameter to minimum 1.5', () => {
        const input: SurvivalInput = {
            ...baseInput,
            baseReliabilityScore: 4.0,
            knownIssues: [{ severity: 'CRITICAL', component: 'engine' }],
            factors: { transmission: 'cvt', maintenance: 'poor' },
        };
        const k = calculateShapeParameter(input);
        // Would be 3.2 - 1.2 - 0.3 - 0.2 - 0.3 = 1.2, but clamped to 1.5
        expect(k).toBe(1.5);
    });

    it('clamps shape parameter to maximum 5.0', () => {
        const input: SurvivalInput = {
            ...baseInput,
            baseReliabilityScore: 9.8,
            vehicleAge: 20,
            currentMileage: 80000,  // Very low for 20 years
        };
        const k = calculateShapeParameter(input);
        // Would be higher but clamped to 5.0
        expect(k).toBeLessThanOrEqual(5.0);
    });
});

describe('calculateSurvivalProbabilities', () => {
    const baseInput: SurvivalInput = {
        currentMileage: 80000,
        vehicleAge: 5,
        adjustedLifespan: 200000,
        baseReliabilityScore: 7.5,
        knownIssues: [],
        factors: {},
        lifespanConfidence: 'medium',
    };

    describe('milestone generation', () => {
        it('returns milestones with decreasing probabilities', () => {
            const result = calculateSurvivalProbabilities(baseInput);

            expect(result.milestones.length).toBeGreaterThanOrEqual(5);

            // Probabilities should decrease as miles increase
            for (let i = 1; i < result.milestones.length; i++) {
                expect(result.milestones[i].probability).toBeLessThanOrEqual(
                    result.milestones[i - 1].probability
                );
            }
        });

        it('returns milestones with correct totalMiles calculation', () => {
            const result = calculateSurvivalProbabilities(baseInput);

            for (const milestone of result.milestones) {
                expect(milestone.totalMiles).toBe(
                    baseInput.currentMileage + milestone.additionalMiles
                );
            }
        });

        it('uses normal milestones for vehicles with good remaining life', () => {
            const result = calculateSurvivalProbabilities(baseInput);

            // Should use normal milestones (50k, 100k, 150k, 200k, 250k)
            expect(result.milestones[0].additionalMiles).toBe(50000);
        });

        it('uses shorter milestones for vehicles with low remaining life', () => {
            const input: SurvivalInput = {
                ...baseInput,
                currentMileage: 195000,  // Near expected lifespan of 200k
                adjustedLifespan: 200000,
            };
            const result = calculateSurvivalProbabilities(input);

            // Should use veryLow milestones (5k, 10k, 15k, 20k, 25k)
            expect(result.milestones[0].additionalMiles).toBe(5000);
        });

        it('uses critical issue milestones when critical issue present', () => {
            const input: SurvivalInput = {
                ...baseInput,
                knownIssues: [{ severity: 'CRITICAL', component: 'engine' }],
            };
            const result = calculateSurvivalProbabilities(input);

            // Should use critical milestones (25k, 50k, 75k, 100k, 125k, 150k)
            expect(result.milestones[0].additionalMiles).toBe(25000);
        });
    });

    describe('risk levels', () => {
        it('assigns safe risk level for probability >= 80%', () => {
            const input: SurvivalInput = {
                ...baseInput,
                currentMileage: 20000,  // Low mileage = high probability
            };
            const result = calculateSurvivalProbabilities(input);

            // First milestone should likely be safe
            const safeMilestones = result.milestones.filter(m => m.riskLevel === 'safe');
            expect(safeMilestones.length).toBeGreaterThan(0);

            for (const milestone of safeMilestones) {
                expect(milestone.probability).toBeGreaterThanOrEqual(0.8);
            }
        });

        it('assigns unlikely risk level for probability < 20%', () => {
            const input: SurvivalInput = {
                ...baseInput,
                currentMileage: 150000,  // Higher mileage
            };
            const result = calculateSurvivalProbabilities(input);

            // Some later milestones should be unlikely
            const unlikelyMilestones = result.milestones.filter(m => m.riskLevel === 'unlikely');

            for (const milestone of unlikelyMilestones) {
                expect(milestone.probability).toBeLessThan(0.2);
            }
        });
    });

    describe('expected additional miles', () => {
        it('returns positive expected additional miles', () => {
            const result = calculateSurvivalProbabilities(baseInput);

            expect(result.expectedAdditionalMiles).toBeGreaterThan(0);
        });

        it('returns higher expected miles for lower current mileage', () => {
            const lowMileageResult = calculateSurvivalProbabilities({
                ...baseInput,
                currentMileage: 30000,
            });
            const highMileageResult = calculateSurvivalProbabilities({
                ...baseInput,
                currentMileage: 150000,
            });

            expect(lowMileageResult.expectedAdditionalMiles).toBeGreaterThan(
                highMileageResult.expectedAdditionalMiles
            );
        });
    });

    describe('confidence range', () => {
        it('returns confidence range with low < high', () => {
            const result = calculateSurvivalProbabilities(baseInput);

            expect(result.confidenceRange.low).toBeLessThan(result.confidenceRange.high);
        });

        it('returns expected miles within confidence range', () => {
            const result = calculateSurvivalProbabilities(baseInput);

            expect(result.expectedAdditionalMiles).toBeGreaterThanOrEqual(result.confidenceRange.low);
            expect(result.expectedAdditionalMiles).toBeLessThanOrEqual(result.confidenceRange.high);
        });
    });

    describe('model confidence', () => {
        it('returns high confidence for good input data', () => {
            const input: SurvivalInput = {
                ...baseInput,
                lifespanConfidence: 'high',
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.modelConfidence).toBe('high');
        });

        it('returns low confidence for vehicles past expected lifespan', () => {
            const input: SurvivalInput = {
                ...baseInput,
                currentMileage: 220000,  // Past 200k expected
                adjustedLifespan: 200000,
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.modelConfidence).toBe('low');
            expect(result.warnings).toContain('Vehicle has exceeded its expected lifespan - predictions have higher uncertainty');
        });

        it('returns low confidence for low lifespan confidence input', () => {
            const input: SurvivalInput = {
                ...baseInput,
                lifespanConfidence: 'low',
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.modelConfidence).toBe('low');
        });

        it('returns medium confidence for critical issues', () => {
            const input: SurvivalInput = {
                ...baseInput,
                lifespanConfidence: 'high',
                knownIssues: [{ severity: 'CRITICAL', component: 'engine' }],
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.modelConfidence).toBe('medium');
        });
    });

    describe('warnings', () => {
        it('adds warning for vehicle past expected lifespan', () => {
            const input: SurvivalInput = {
                ...baseInput,
                currentMileage: 250000,
                adjustedLifespan: 200000,
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.warnings.some(w => w.includes('exceeded'))).toBe(true);
        });

        it('adds warning for critical known issues', () => {
            const input: SurvivalInput = {
                ...baseInput,
                knownIssues: [{ severity: 'CRITICAL', component: 'engine' }],
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.warnings.some(w => w.includes('critical'))).toBe(true);
        });

        it('adds warning for poor maintenance', () => {
            const input: SurvivalInput = {
                ...baseInput,
                factors: { maintenance: 'poor' },
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.warnings.some(w => w.includes('maintenance'))).toBe(true);
        });

        it('adds warning for low confidence input', () => {
            const input: SurvivalInput = {
                ...baseInput,
                lifespanConfidence: 'low',
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.warnings.some(w => w.includes('Limited information'))).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('handles zero mileage vehicle', () => {
            const input: SurvivalInput = {
                ...baseInput,
                currentMileage: 0,
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.milestones.length).toBeGreaterThan(0);
            expect(result.expectedAdditionalMiles).toBeGreaterThan(0);
            // First milestone should have very high probability for new car
            expect(result.milestones[0].probability).toBeGreaterThan(0.9);
        });

        it('handles high mileage vehicle past expected lifespan', () => {
            const input: SurvivalInput = {
                ...baseInput,
                currentMileage: 300000,
                adjustedLifespan: 200000,
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.milestones.length).toBeGreaterThan(0);
            // Should still return valid probabilities
            for (const milestone of result.milestones) {
                expect(milestone.probability).toBeGreaterThanOrEqual(0);
                expect(milestone.probability).toBeLessThanOrEqual(1);
            }
        });

        it('handles very low adjusted lifespan', () => {
            const input: SurvivalInput = {
                ...baseInput,
                adjustedLifespan: 50000,
                currentMileage: 40000,
            };
            const result = calculateSurvivalProbabilities(input);

            expect(result.milestones.length).toBeGreaterThan(0);
            // Should use low-mile milestones
            expect(result.milestones[0].additionalMiles).toBeLessThanOrEqual(10000);
        });
    });
});

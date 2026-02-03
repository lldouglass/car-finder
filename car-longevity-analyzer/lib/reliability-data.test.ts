import { describe, it, expect } from 'vitest';
import { getReliabilityData, RELIABILITY_DATA, KnownIssue } from './reliability-data';

describe('getReliabilityData', () => {
    describe('exact matching', () => {
        it('finds exact match for Toyota Camry', () => {
            const result = getReliabilityData('Toyota', 'Camry');
            expect(result).not.toBeNull();
            expect(result?.make).toBe('Toyota');
            expect(result?.model).toBe('Camry');
            expect(result?.baseScore).toBe(9.5);
        });

        it('finds exact match for Honda Civic', () => {
            const result = getReliabilityData('Honda', 'Civic');
            expect(result).not.toBeNull();
            expect(result?.baseScore).toBe(9.0);
        });

        it('handles case-insensitive make', () => {
            const result = getReliabilityData('TOYOTA', 'Camry');
            expect(result).not.toBeNull();
            expect(result?.make).toBe('Toyota');
        });

        it('handles case-insensitive model', () => {
            const result = getReliabilityData('Toyota', 'CAMRY');
            expect(result).not.toBeNull();
            expect(result?.model).toBe('Camry');
        });

        it('handles mixed case', () => {
            const result = getReliabilityData('tOyOtA', 'cAmRy');
            expect(result).not.toBeNull();
        });
    });

    describe('fuzzy matching', () => {
        it('matches with trim level suffix', () => {
            const result = getReliabilityData('Honda', 'Civic EX');
            expect(result).not.toBeNull();
            expect(result?.model).toBe('Civic');
        });

        it('matches with LX trim', () => {
            const result = getReliabilityData('Toyota', 'Camry LE');
            expect(result).not.toBeNull();
            expect(result?.model).toBe('Camry');
        });

        it('matches with Sport trim', () => {
            const result = getReliabilityData('Honda', 'Accord Sport');
            expect(result).not.toBeNull();
            expect(result?.model).toBe('Accord');
        });

        it('matches Mazda 3 variants', () => {
            // Database has both 'Mazda3' and '3'
            const result1 = getReliabilityData('Mazda', 'Mazda3');
            const result2 = getReliabilityData('Mazda', '3');
            expect(result1).not.toBeNull();
            expect(result2).not.toBeNull();
        });

        it('handles hyphenated models', () => {
            const result = getReliabilityData('Honda', 'CR-V');
            expect(result).not.toBeNull();
            expect(result?.model).toBe('CR-V');
        });

        it('handles model with spaces', () => {
            const result = getReliabilityData('Subaru', 'Outback');
            expect(result).not.toBeNull();
        });
    });

    describe('no match scenarios', () => {
        it('returns null for unknown make', () => {
            const result = getReliabilityData('UnknownMake', 'Camry');
            expect(result).toBeNull();
        });

        it('returns null for unknown model', () => {
            const result = getReliabilityData('Toyota', 'UnknownModel');
            expect(result).toBeNull();
        });

        it('returns null for completely unknown vehicle', () => {
            const result = getReliabilityData('Fictional', 'Car');
            expect(result).toBeNull();
        });

        it('returns null for empty strings', () => {
            const result = getReliabilityData('', '');
            expect(result).toBeNull();
        });
    });

    describe('edge cases', () => {
        it('handles extra whitespace', () => {
            const result = getReliabilityData('  Toyota  ', '  Camry  ');
            expect(result).not.toBeNull();
        });

        it('handles model with numbers', () => {
            const result = getReliabilityData('Mazda', 'CX-5');
            expect(result).not.toBeNull();
            expect(result?.model).toBe('CX-5');
        });

        it('does not match wrong make', () => {
            // Should not match Toyota Camry when searching for Honda Camry
            const result = getReliabilityData('Honda', 'Camry');
            expect(result).toBeNull();
        });
    });

    describe('data integrity', () => {
        it('all entries have required fields', () => {
            for (const vehicle of RELIABILITY_DATA) {
                expect(vehicle.make).toBeDefined();
                expect(vehicle.make.length).toBeGreaterThan(0);
                expect(vehicle.model).toBeDefined();
                expect(vehicle.model.length).toBeGreaterThan(0);
                expect(vehicle.baseScore).toBeGreaterThanOrEqual(1);
                expect(vehicle.baseScore).toBeLessThanOrEqual(10);
                expect(vehicle.expectedLifespanMiles).toBeGreaterThan(0);
                expect(Array.isArray(vehicle.yearsToAvoid)).toBe(true);
            }
        });

        it('yearsToAvoid are valid years', () => {
            for (const vehicle of RELIABILITY_DATA) {
                for (const year of vehicle.yearsToAvoid) {
                    expect(year).toBeGreaterThan(1990);
                    expect(year).toBeLessThan(2030);
                }
            }
        });

        it('expectedLifespanMiles are reasonable', () => {
            for (const vehicle of RELIABILITY_DATA) {
                expect(vehicle.expectedLifespanMiles).toBeGreaterThanOrEqual(70000);
                expect(vehicle.expectedLifespanMiles).toBeLessThanOrEqual(350000);
            }
        });
    });

    describe('specific vehicle data', () => {
        it('Toyota Camry has correct years to avoid', () => {
            const result = getReliabilityData('Toyota', 'Camry');
            expect(result?.yearsToAvoid).toContain(2007);
            expect(result?.yearsToAvoid).toContain(2008);
            expect(result?.yearsToAvoid).toContain(2009);
        });

        it('Nissan models have lower reliability scores (CVT issues)', () => {
            const altima = getReliabilityData('Nissan', 'Altima');
            const rogue = getReliabilityData('Nissan', 'Rogue');
            expect(altima?.baseScore).toBeLessThan(7);
            expect(rogue?.baseScore).toBeLessThan(7);
        });

        it('Toyota/Honda have high reliability scores', () => {
            const camry = getReliabilityData('Toyota', 'Camry');
            const accord = getReliabilityData('Honda', 'Accord');
            expect(camry?.baseScore).toBeGreaterThanOrEqual(9);
            expect(accord?.baseScore).toBeGreaterThanOrEqual(9);
        });

        it('Trucks have high expected lifespan', () => {
            const f150 = getReliabilityData('Ford', 'F-150');
            const silverado = getReliabilityData('Chevrolet', 'Silverado');
            expect(f150?.expectedLifespanMiles).toBeGreaterThanOrEqual(150000);
            expect(silverado?.expectedLifespanMiles).toBeGreaterThanOrEqual(150000);
        });
    });

    describe('known issues', () => {
        it('Nissan Altima has CVT transmission known issues', () => {
            const altima = getReliabilityData('Nissan', 'Altima');
            expect(altima?.knownIssues).toBeDefined();
            expect(altima?.knownIssues?.length).toBeGreaterThan(0);
            const cvtIssue = altima?.knownIssues?.find(i => i.component === 'transmission');
            expect(cvtIssue).toBeDefined();
            expect(cvtIssue?.severity).toBe('critical');
        });

        it('Ford Focus has PowerShift DCT known issues', () => {
            const focus = getReliabilityData('Ford', 'Focus');
            expect(focus?.knownIssues).toBeDefined();
            const dctIssue = focus?.knownIssues?.find(i =>
                i.description.toLowerCase().includes('powershift') ||
                i.description.toLowerCase().includes('dct')
            );
            expect(dctIssue).toBeDefined();
            expect(dctIssue?.component).toBe('transmission');
        });

        it('Subaru Outback has head gasket known issues', () => {
            const outback = getReliabilityData('Subaru', 'Outback');
            expect(outback?.knownIssues).toBeDefined();
            const headGasketIssue = outback?.knownIssues?.find(i =>
                i.description.toLowerCase().includes('head gasket')
            );
            expect(headGasketIssue).toBeDefined();
            expect(headGasketIssue?.component).toBe('engine');
        });

        it('Hyundai Sonata has Theta II engine known issues', () => {
            const sonata = getReliabilityData('Hyundai', 'Sonata');
            expect(sonata?.knownIssues).toBeDefined();
            const engineIssue = sonata?.knownIssues?.find(i =>
                i.description.toLowerCase().includes('theta')
            );
            expect(engineIssue).toBeDefined();
            expect(engineIssue?.severity).toBe('critical');
        });

        it('known issues have valid structure', () => {
            const vehiclesWithIssues = RELIABILITY_DATA.filter(v => v.knownIssues && v.knownIssues.length > 0);
            expect(vehiclesWithIssues.length).toBeGreaterThan(0);

            for (const vehicle of vehiclesWithIssues) {
                for (const issue of vehicle.knownIssues!) {
                    // Check required fields
                    expect(issue.description).toBeDefined();
                    expect(issue.description.length).toBeGreaterThan(0);
                    expect(issue.repairCost.low).toBeLessThanOrEqual(issue.repairCost.high);
                    expect(issue.mileageRange.start).toBeLessThanOrEqual(issue.mileageRange.end);
                    expect(['minor', 'moderate', 'major', 'critical']).toContain(issue.severity);
                    expect(['engine', 'transmission', 'electrical', 'suspension', 'brakes',
                            'body', 'interior', 'fuel', 'cooling', 'exhaust', 'steering', 'hvac'])
                        .toContain(issue.component);
                }
            }
        });

        it('repair costs are reasonable', () => {
            const vehiclesWithIssues = RELIABILITY_DATA.filter(v => v.knownIssues && v.knownIssues.length > 0);

            for (const vehicle of vehiclesWithIssues) {
                for (const issue of vehicle.knownIssues!) {
                    expect(issue.repairCost.low).toBeGreaterThanOrEqual(0);
                    expect(issue.repairCost.high).toBeLessThanOrEqual(20000);
                }
            }
        });
    });
});

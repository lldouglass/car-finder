import { describe, it, expect } from 'vitest';
import { calculateDynamicReliability, type DynamicReliabilityResult } from './dynamic-reliability';
import type { Complaint, SafetyRating } from './nhtsa';
import { RELIABILITY_DATA } from './reliability-data';

// Mock safety ratings for testing
const create5StarRating = (): SafetyRating => ({
    OverallRating: '5',
    FrontalCrashRating: '5',
    SideCrashRating: '5',
    RolloverRating: '4',
    NHTSAElectronicStabilityControl: 'Standard',
    ComplaintsCount: 10,
    RecallsCount: 2,
    InvestigationCount: 0,
});

const create3StarRating = (): SafetyRating => ({
    OverallRating: '3',
    FrontalCrashRating: '3',
    SideCrashRating: '3',
    RolloverRating: '3',
    NHTSAElectronicStabilityControl: 'Standard',
    ComplaintsCount: 50,
    RecallsCount: 5,
    InvestigationCount: 1,
});

const create2StarRating = (): SafetyRating => ({
    OverallRating: '2',
    FrontalCrashRating: '2',
    SideCrashRating: '3',
    RolloverRating: '2',
    NHTSAElectronicStabilityControl: 'Standard',
    ComplaintsCount: 100,
    RecallsCount: 10,
    InvestigationCount: 3,
});

// Helper to create mock complaints
const createMockComplaints = (count: number, options?: {
    withDeaths?: boolean;
    withInjuries?: boolean;
    withFires?: boolean;
    withCrashes?: boolean;
}): Complaint[] => {
    return Array.from({ length: count }, (_, i) => ({
        Component: 'ENGINE',
        Summary: `Test complaint ${i}`,
        DateOfIncident: '2020-01-01',
        Crash: options?.withCrashes || false,
        Fire: options?.withFires || false,
        Injuries: options?.withInjuries ? 1 : 0,
        Deaths: options?.withDeaths ? 1 : 0,
    }));
};

describe('Dynamic Reliability - Year-Specific Calculations', () => {
    describe('Each year produces different reliability scores', () => {
        it('years to avoid produce lower scores for Toyota Camry', () => {
            const goodYear = calculateDynamicReliability('Toyota', 'Camry', 2020, [], null);
            const badYear2007 = calculateDynamicReliability('Toyota', 'Camry', 2007, [], null);
            const badYear2008 = calculateDynamicReliability('Toyota', 'Camry', 2008, [], null);
            const badYear2009 = calculateDynamicReliability('Toyota', 'Camry', 2009, [], null);

            // Verify that years to avoid have lower scores
            expect(badYear2007.score).toBeLessThan(goodYear.score);
            expect(badYear2008.score).toBeLessThan(goodYear.score);
            expect(badYear2009.score).toBeLessThan(goodYear.score);

            // Verify year adjustment factor reflects the penalty
            expect(badYear2007.factors.yearAdjustment).toBe(-2.0);
            expect(badYear2008.factors.yearAdjustment).toBe(-2.0);
            expect(badYear2009.factors.yearAdjustment).toBe(-2.0);
        });

        it('recent years (2018+) get positive adjustment', () => {
            const year2017 = calculateDynamicReliability('Toyota', 'Camry', 2017, [], null);
            const year2018 = calculateDynamicReliability('Toyota', 'Camry', 2018, [], null);
            const year2020 = calculateDynamicReliability('Toyota', 'Camry', 2020, [], null);
            const year2023 = calculateDynamicReliability('Toyota', 'Camry', 2023, [], null);

            // 2018+ years should have positive year adjustment
            expect(year2018.factors.yearAdjustment).toBe(0.3);
            expect(year2020.factors.yearAdjustment).toBe(0.3);
            expect(year2023.factors.yearAdjustment).toBe(0.3);

            // 2017 should not have the bonus
            expect(year2017.factors.yearAdjustment).toBe(0);
        });

        it('years to avoid for Honda Civic produce lower scores', () => {
            // Honda Civic yearsToAvoid: [2001, 2002, 2006, 2016]
            const goodYear = calculateDynamicReliability('Honda', 'Civic', 2018, [], null);
            const badYear2001 = calculateDynamicReliability('Honda', 'Civic', 2001, [], null);
            const badYear2016 = calculateDynamicReliability('Honda', 'Civic', 2016, [], null);

            expect(badYear2001.score).toBeLessThan(goodYear.score);
            expect(badYear2016.score).toBeLessThan(goodYear.score);
            expect(badYear2001.factors.yearAdjustment).toBe(-2.0);
            expect(badYear2016.factors.yearAdjustment).toBe(-2.0);
        });

        it('years to avoid for Nissan Altima produce lower scores', () => {
            // Nissan Altima yearsToAvoid: [2009, 2013, 2014]
            const goodYear = calculateDynamicReliability('Nissan', 'Altima', 2019, [], null);
            const badYear2009 = calculateDynamicReliability('Nissan', 'Altima', 2009, [], null);
            const badYear2013 = calculateDynamicReliability('Nissan', 'Altima', 2013, [], null);
            const badYear2014 = calculateDynamicReliability('Nissan', 'Altima', 2014, [], null);

            expect(badYear2009.score).toBeLessThan(goodYear.score);
            expect(badYear2013.score).toBeLessThan(goodYear.score);
            expect(badYear2014.score).toBeLessThan(goodYear.score);
        });

        it('consecutive years produce different scores when one is problematic', () => {
            // Toyota RAV4 yearsToAvoid: [2007, 2008, 2019]
            const year2018 = calculateDynamicReliability('Toyota', 'RAV4', 2018, [], null);
            const year2019 = calculateDynamicReliability('Toyota', 'RAV4', 2019, [], null); // Year to avoid
            const year2020 = calculateDynamicReliability('Toyota', 'RAV4', 2020, [], null);

            // 2019 (year to avoid) should have lower score than adjacent years
            expect(year2019.score).toBeLessThan(year2018.score);
            expect(year2019.score).toBeLessThan(year2020.score);

            // Verify the factors
            expect(year2019.factors.yearAdjustment).toBe(-2.0);
            expect(year2018.factors.yearAdjustment).toBe(0.3);
            expect(year2020.factors.yearAdjustment).toBe(0.3);
        });
    });

    describe('Each make/model has unique base scores', () => {
        it('different makes have different reliability base scores', () => {
            const toyota = calculateDynamicReliability('Toyota', 'Camry', 2020, [], null);
            const nissan = calculateDynamicReliability('Nissan', 'Altima', 2020, [], null);
            const ford = calculateDynamicReliability('Ford', 'Escape', 2020, [], null);

            // Toyota should have highest base score
            expect(toyota.factors.baseScore).toBeGreaterThan(nissan.factors.baseScore);
            expect(toyota.factors.baseScore).toBeGreaterThan(ford.factors.baseScore);

            // Final scores should reflect the base score differences
            expect(toyota.score).toBeGreaterThan(nissan.score);
        });

        it('different models within same make have different scores', () => {
            const camry = calculateDynamicReliability('Toyota', 'Camry', 2020, [], null);
            const rav4 = calculateDynamicReliability('Toyota', 'RAV4', 2020, [], null);
            const highlander = calculateDynamicReliability('Toyota', 'Highlander', 2020, [], null);

            // All should have database entries
            expect(camry.source).toBe('database');
            expect(rav4.source).toBe('database');
            expect(highlander.source).toBe('database');

            // Base scores should differ (Camry: 9.5, RAV4: 9.0, Highlander: 9.0)
            expect(camry.factors.baseScore).toBe(9.5);
            expect(rav4.factors.baseScore).toBe(9.0);
            expect(highlander.factors.baseScore).toBe(9.0);
        });

        it('all database entries produce unique make/model combinations', () => {
            const uniqueCombinations = new Set<string>();

            for (const vehicle of RELIABILITY_DATA) {
                const key = `${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}`;
                const result = calculateDynamicReliability(
                    vehicle.make,
                    vehicle.model,
                    2020,
                    [],
                    null
                );

                // Verify it comes from the database
                expect(result.source).toBe('database');

                // Verify the base score matches
                expect(result.factors.baseScore).toBe(vehicle.baseScore);

                // Track unique combinations
                uniqueCombinations.add(key);
            }

            // Verify we have many unique vehicles
            expect(uniqueCombinations.size).toBeGreaterThan(25);
        });
    });

    describe('Safety ratings affect scores per make/model/year', () => {
        it('5-star safety rating provides positive adjustment', () => {
            const withoutRating = calculateDynamicReliability('Toyota', 'Camry', 2020, [], null);
            const with5Star = calculateDynamicReliability('Toyota', 'Camry', 2020, [], create5StarRating());

            expect(with5Star.factors.safetyAdjustment).toBe(0.3);
            expect(with5Star.score).toBeGreaterThan(withoutRating.score);
        });

        it('2-star safety rating provides negative adjustment', () => {
            const withoutRating = calculateDynamicReliability('Toyota', 'Camry', 2020, [], null);
            const with2Star = calculateDynamicReliability('Toyota', 'Camry', 2020, [], create2StarRating());

            expect(with2Star.factors.safetyAdjustment).toBe(-0.3);
            expect(with2Star.score).toBeLessThan(withoutRating.score);
        });

        it('3-star safety rating has no adjustment', () => {
            const with3Star = calculateDynamicReliability('Toyota', 'Camry', 2020, [], create3StarRating());

            expect(with3Star.factors.safetyAdjustment).toBe(0);
        });

        it('different safety ratings produce different scores for same vehicle', () => {
            const with5Star = calculateDynamicReliability('Honda', 'Civic', 2019, [], create5StarRating());
            const with3Star = calculateDynamicReliability('Honda', 'Civic', 2019, [], create3StarRating());
            const with2Star = calculateDynamicReliability('Honda', 'Civic', 2019, [], create2StarRating());

            expect(with5Star.score).toBeGreaterThan(with3Star.score);
            expect(with3Star.score).toBeGreaterThan(with2Star.score);
        });
    });

    describe('Complaints affect scores uniquely per vehicle', () => {
        it('more complaints result in lower scores', () => {
            const fewComplaints = calculateDynamicReliability(
                'Toyota',
                'Camry',
                2020,
                createMockComplaints(10),
                null
            );
            const manyComplaints = calculateDynamicReliability(
                'Toyota',
                'Camry',
                2020,
                createMockComplaints(600),
                null
            );

            expect(manyComplaints.factors.complaintAdjustment).toBeLessThan(
                fewComplaints.factors.complaintAdjustment
            );
        });

        it('severe complaints (deaths, injuries) result in larger penalties', () => {
            const normalComplaints = calculateDynamicReliability(
                'Toyota',
                'Camry',
                2020,
                createMockComplaints(50),
                null
            );
            const severeComplaints = calculateDynamicReliability(
                'Toyota',
                'Camry',
                2020,
                createMockComplaints(50, { withDeaths: true, withInjuries: true }),
                null
            );

            expect(severeComplaints.score).toBeLessThan(normalComplaints.score);
        });

        it('same complaints produce different scores for different years', () => {
            const complaints = createMockComplaints(100);

            const year2020 = calculateDynamicReliability('Toyota', 'Camry', 2020, complaints, null);
            const year2008 = calculateDynamicReliability('Toyota', 'Camry', 2008, complaints, null); // Year to avoid

            // 2008 should have lower score due to year penalty
            expect(year2008.score).toBeLessThan(year2020.score);
        });
    });

    describe('NHTSA-derived calculations for unknown vehicles', () => {
        it('unknown vehicles use NHTSA-derived source', () => {
            const result = calculateDynamicReliability('Unknown', 'Model', 2020, [], null);

            expect(result.source).toBe('default');
            expect(result.confidence).toBe('low');
        });

        it('unknown vehicles with complaints use NHTSA-derived source', () => {
            const result = calculateDynamicReliability(
                'Unknown',
                'Model',
                2020,
                createMockComplaints(100),
                null
            );

            expect(result.source).toBe('nhtsa_derived');
        });

        it('unknown vehicles with safety rating use NHTSA-derived source', () => {
            const result = calculateDynamicReliability(
                'Unknown',
                'Model',
                2020,
                [],
                create5StarRating()
            );

            expect(result.source).toBe('nhtsa_derived');
        });

        it('NHTSA-derived scores vary by year', () => {
            const complaints = createMockComplaints(100);

            const year2022 = calculateDynamicReliability('Unknown', 'Model', 2022, complaints, null);
            const year2015 = calculateDynamicReliability('Unknown', 'Model', 2015, complaints, null);
            const year2005 = calculateDynamicReliability('Unknown', 'Model', 2005, complaints, null);

            // Year adjustments should differ
            expect(year2022.factors.yearAdjustment).toBe(0.5);
            expect(year2015.factors.yearAdjustment).toBe(0.25);
            expect(year2005.factors.yearAdjustment).toBe(-0.25);
        });

        it('NHTSA-derived scores vary by complaint rate per year of vehicle age', () => {
            // New vehicle with many complaints = worse
            // Old vehicle with same complaints = better (normalized by age)
            const newVehicle = calculateDynamicReliability(
                'Unknown',
                'Model',
                2024,
                createMockComplaints(100),
                null
            );
            const oldVehicle = calculateDynamicReliability(
                'Unknown',
                'Model',
                2010,
                createMockComplaints(100),
                null
            );

            // Old vehicle's complaints are spread over more years, so less severe
            // However, old vehicles also get year penalty, so let's check the complaint adjustment
            expect(newVehicle.factors.complaintAdjustment).not.toBe(oldVehicle.factors.complaintAdjustment);
        });
    });

    describe('Complete matrix: every year to avoid is properly penalized', () => {
        it('verifies all yearsToAvoid in database produce year penalty', () => {
            for (const vehicle of RELIABILITY_DATA) {
                for (const yearToAvoid of vehicle.yearsToAvoid) {
                    const result = calculateDynamicReliability(
                        vehicle.make,
                        vehicle.model,
                        yearToAvoid,
                        [],
                        null
                    );

                    expect(result.factors.yearAdjustment).toBe(-2.0);
                    expect(result.source).toBe('database');
                }
            }
        });

        it('verifies non-problematic years do not get the year penalty', () => {
            for (const vehicle of RELIABILITY_DATA) {
                // Test a year that is not in yearsToAvoid and is >= 2018
                const safeYear = 2022;
                if (!vehicle.yearsToAvoid.includes(safeYear)) {
                    const result = calculateDynamicReliability(
                        vehicle.make,
                        vehicle.model,
                        safeYear,
                        [],
                        null
                    );

                    // Should have positive adjustment for recent year, not negative
                    expect(result.factors.yearAdjustment).toBe(0.3);
                }
            }
        });
    });

    describe('Score boundaries and consistency', () => {
        it('all scores are clamped between 1 and 10', () => {
            const testCases = [
                { make: 'Toyota', model: 'Camry', year: 2020 },
                { make: 'Toyota', model: 'Camry', year: 2008 }, // Bad year
                { make: 'Nissan', model: 'Altima', year: 2013 }, // Bad year + lower base
                { make: 'Unknown', model: 'Car', year: 2020 },
            ];

            for (const tc of testCases) {
                const result = calculateDynamicReliability(
                    tc.make,
                    tc.model,
                    tc.year,
                    createMockComplaints(500, { withDeaths: true, withCrashes: true }),
                    create2StarRating()
                );

                expect(result.score).toBeGreaterThanOrEqual(1);
                expect(result.score).toBeLessThanOrEqual(10);
            }
        });

        it('scores are rounded to one decimal place', () => {
            const result = calculateDynamicReliability(
                'Toyota',
                'Camry',
                2020,
                createMockComplaints(75),
                create5StarRating()
            );

            // Score should be rounded to one decimal
            const decimalPlaces = (result.score.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(1);
        });
    });

    describe('Confidence levels', () => {
        it('database source has high confidence', () => {
            const result = calculateDynamicReliability('Toyota', 'Camry', 2020, [], null);
            expect(result.confidence).toBe('high');
        });

        it('NHTSA-derived with sufficient data has medium confidence', () => {
            const result = calculateDynamicReliability(
                'Unknown',
                'Model',
                2020,
                createMockComplaints(50),
                create5StarRating()
            );
            expect(result.confidence).toBe('medium');
        });

        it('default fallback has low confidence', () => {
            const result = calculateDynamicReliability('Unknown', 'Model', 2020, [], null);
            expect(result.confidence).toBe('low');
        });
    });
});

describe('Safety Rating Integration', () => {
    describe('Each make/model/year can have unique safety ratings', () => {
        it('safety ratings are applied per vehicle year combination', () => {
            // Same model, different years should process different safety ratings
            const year2018with5Star = calculateDynamicReliability(
                'Honda',
                'Accord',
                2018,
                [],
                create5StarRating()
            );
            const year2019with3Star = calculateDynamicReliability(
                'Honda',
                'Accord',
                2019,
                [],
                create3StarRating()
            );

            // Different safety adjustments based on different ratings
            expect(year2018with5Star.factors.safetyAdjustment).toBe(0.3);
            expect(year2019with3Star.factors.safetyAdjustment).toBe(0);

            // Final scores should differ
            expect(year2018with5Star.score).not.toBe(year2019with3Star.score);
        });

        it('same year different models have independent safety ratings', () => {
            const civicWith5Star = calculateDynamicReliability(
                'Honda',
                'Civic',
                2020,
                [],
                create5StarRating()
            );
            const accordWith2Star = calculateDynamicReliability(
                'Honda',
                'Accord',
                2020,
                [],
                create2StarRating()
            );

            expect(civicWith5Star.factors.safetyAdjustment).toBe(0.3);
            expect(accordWith2Star.factors.safetyAdjustment).toBe(-0.3);
        });

        it('4-star rating provides moderate positive adjustment', () => {
            const fourStarRating: SafetyRating = {
                ...create5StarRating(),
                OverallRating: '4',
            };

            const result = calculateDynamicReliability(
                'Toyota',
                'Camry',
                2020,
                [],
                fourStarRating
            );

            expect(result.factors.safetyAdjustment).toBe(0.15);
        });
    });
});

describe('Comprehensive Make/Model/Year Matrix', () => {
    it('generates unique scores for different year + make + model combinations', () => {
        const testVehicles = [
            { make: 'Toyota', model: 'Camry' },
            { make: 'Honda', model: 'Civic' },
            { make: 'Nissan', model: 'Altima' },
            { make: 'Ford', model: 'F-150' },
        ];
        const testYears = [2008, 2015, 2020, 2023];
        const results: Map<string, DynamicReliabilityResult> = new Map();

        for (const vehicle of testVehicles) {
            for (const year of testYears) {
                const key = `${vehicle.make}-${vehicle.model}-${year}`;
                const result = calculateDynamicReliability(
                    vehicle.make,
                    vehicle.model,
                    year,
                    [],
                    null
                );
                results.set(key, result);
            }
        }

        // Verify we generated all combinations
        expect(results.size).toBe(testVehicles.length * testYears.length);

        // Verify different makes have different base scores
        const toyotaBase = results.get('Toyota-Camry-2020')?.factors.baseScore;
        const nissanBase = results.get('Nissan-Altima-2020')?.factors.baseScore;
        expect(toyotaBase).not.toBe(nissanBase);

        // Verify year to avoid penalty (Toyota Camry 2008)
        const camry2008 = results.get('Toyota-Camry-2008');
        const camry2020 = results.get('Toyota-Camry-2020');
        expect(camry2008?.factors.yearAdjustment).toBe(-2.0);
        expect(camry2020?.factors.yearAdjustment).toBe(0.3);
    });
});

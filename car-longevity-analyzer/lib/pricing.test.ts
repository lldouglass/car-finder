import { describe, it, expect } from 'vitest';
import {
    estimateFairPrice,
    estimateFairPriceDetailed,
    getApproximateMsrp,
    getMsrpData,
} from './pricing';

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
        expect(data.baseMsrp).toBe(28000);
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

    it('returns correct category for SUVs (maps truck_suv to truck)', () => {
        const data = getMsrpData('Toyota', 'Highlander');
        expect(data.category).toBe('truck');
    });

    it('returns correct category for mainstream (maps to midsize)', () => {
        const data = getMsrpData('Toyota', 'RAV4');
        expect(data.category).toBe('midsize');
    });
});

describe('getApproximateMsrp', () => {
    it('returns baseMsrp from database for known vehicle', () => {
        const msrp = getApproximateMsrp('Honda', 'Accord');
        expect(msrp).toBe(29000);
    });

    it('returns estimated MSRP for unknown vehicle', () => {
        const msrp = getApproximateMsrp('UnknownMake', 'UnknownModel');
        expect(msrp).toBeGreaterThan(0);
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

    it('respects minimum value floor', () => {
        // Very old, high mileage car
        const estimate = estimateFairPrice('Unknown', 'Model', 1990, 300000);
        expect(estimate.low).toBeGreaterThanOrEqual(1500);
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

    it('handles edge case: zero mileage', () => {
        const estimate = estimateFairPrice('Toyota', 'Camry', 2020, 0);
        expect(estimate.midpoint).toBeGreaterThan(0);
    });

    it('handles edge case: very high mileage', () => {
        const estimate = estimateFairPrice('Toyota', 'Camry', 2020, 500000);
        expect(estimate.low).toBeGreaterThanOrEqual(1500);
    });

    it('calculates range correctly (low < mid < high)', () => {
        const estimate = estimateFairPrice('Honda', 'Civic', 2019, 45000);
        expect(estimate.low).toBeLessThan(estimate.midpoint);
        expect(estimate.midpoint).toBeLessThan(estimate.high);
    });
});

describe('estimateFairPriceDetailed', () => {
    it('returns detailed breakdown for known vehicle', () => {
        const result = estimateFairPriceDetailed('Toyota', 'Camry', 2020, 50000);

        expect(result.confidence).toBe('high');
        expect(result.msrpEstimate.source).toBe('database');
        expect(result.depreciationCategory).toBe('mainstream');
        expect(result.factors.depreciationRetention).toBeGreaterThan(0);
        expect(result.factors.depreciationRetention).toBeLessThan(1);
    });

    it('returns lower confidence for unknown vehicle', () => {
        const result = estimateFairPriceDetailed('UnknownMake', 'UnknownModel', 2020, 50000);

        expect(result.confidence).toBe('low');
        expect(result.msrpEstimate.source).toBe('estimated');
    });

    it('returns medium confidence for EVs', () => {
        const result = estimateFairPriceDetailed(
            'Tesla',
            'Model 3',
            2022,
            30000,
            { fuelType: 'Electric' }
        );

        expect(result.confidence).toBe('medium');
        expect(result.depreciationCategory).toBe('ev');
        expect(result.warnings.some(w => w.includes('EV'))).toBe(true);
    });

    it('applies regional adjustment when state is provided', () => {
        const baseResult = estimateFairPriceDetailed('Toyota', 'Camry', 2020, 50000);
        const caResult = estimateFairPriceDetailed('Toyota', 'Camry', 2020, 50000, {}, 'CA');
        const ilResult = estimateFairPriceDetailed('Toyota', 'Camry', 2020, 50000, {}, 'IL');

        // California should be higher (1.08 multiplier)
        expect(caResult.midpoint).toBeGreaterThan(baseResult.midpoint);
        // Illinois should be lower (0.95 multiplier)
        expect(ilResult.midpoint).toBeLessThan(baseResult.midpoint);

        expect(caResult.regionalAdjustment).toBeDefined();
        expect(caResult.regionalAdjustment!.region).toBe('pacific');
    });

    it('applies reliability adjustment when score is provided', () => {
        // Camry (very reliable Toyota)
        const highReliability = estimateFairPriceDetailed(
            'Toyota',
            'Camry',
            2020,
            50000,
            {},
            undefined,
            9.5  // Above Toyota average of 8.5
        );

        const lowReliability = estimateFairPriceDetailed(
            'Toyota',
            'Camry',
            2020,
            50000,
            {},
            undefined,
            6.5  // Below Toyota average of 8.5
        );

        expect(highReliability.factors.reliabilityAdjustment).toBeGreaterThan(0);
        expect(lowReliability.factors.reliabilityAdjustment).toBeLessThan(0);
        expect(highReliability.midpoint).toBeGreaterThan(lowReliability.midpoint);
    });

    it('adds warnings for very old vehicles', () => {
        const result = estimateFairPriceDetailed('Toyota', 'Camry', 2000, 150000);

        expect(result.warnings.some(w => w.includes('old vehicles'))).toBe(true);
        // Known models retain medium confidence even when very old
        expect(result.confidence).toBe('medium');
    });

    it('returns low confidence for unknown very old vehicles', () => {
        const result = estimateFairPriceDetailed('UnknownMake', 'UnknownModel', 2000, 150000);

        expect(result.warnings.some(w => w.includes('old vehicles'))).toBe(true);
        expect(result.confidence).toBe('low');
    });

    it('adds warnings for extremely high mileage', () => {
        const result = estimateFairPriceDetailed('Toyota', 'Camry', 2015, 250000);

        expect(result.warnings.some(w => w.includes('mileage'))).toBe(true);
    });

    it('uses EV depreciation curve for electric vehicles', () => {
        const evResult = estimateFairPriceDetailed(
            'Tesla',
            'Model 3',
            2021,
            40000,
            { fuelType: 'Electric' }
        );

        const iceResult = estimateFairPriceDetailed(
            'Tesla',
            'Model 3',
            2021,
            40000,
            { fuelType: 'Gasoline' }  // Hypothetical gas Model 3
        );

        // EV should depreciate faster in early years
        expect(evResult.factors.depreciationRetention).toBeLessThan(
            iceResult.factors.depreciationRetention
        );
    });
});

describe('depreciation curves', () => {
    it('depreciates correctly over 5 years', () => {
        const result = estimateFairPriceDetailed('Toyota', 'Camry', 2021, 60000);

        // Mainstream vehicles should retain about 48-61% after 5 years
        expect(result.factors.depreciationRetention).toBeGreaterThan(0.45);
        expect(result.factors.depreciationRetention).toBeLessThan(0.65);
    });

    it('depreciates trucks less than economy cars', () => {
        const truck = estimateFairPriceDetailed('Toyota', 'Tacoma', 2019, 70000);
        const economy = estimateFairPriceDetailed('Honda', 'Civic', 2019, 70000);

        expect(truck.factors.depreciationRetention).toBeGreaterThan(
            economy.factors.depreciationRetention
        );
    });

    it('depreciates luxury faster than mainstream', () => {
        const luxury = estimateFairPriceDetailed('BMW', '3 Series', 2019, 50000);
        const mainstream = estimateFairPriceDetailed('Toyota', 'Camry', 2019, 50000);

        expect(luxury.factors.depreciationRetention).toBeLessThan(
            mainstream.factors.depreciationRetention
        );
    });
});

describe('mileage adjustment', () => {
    it('gives premium for low mileage', () => {
        // 5-year-old car with only 30k miles (expected: 60k)
        const result = estimateFairPriceDetailed('Toyota', 'Camry', 2021, 30000);
        expect(result.factors.mileageAdjustment).toBeGreaterThan(0);
    });

    it('penalizes high mileage', () => {
        // 5-year-old car with 100k miles (expected: 60k)
        const result = estimateFairPriceDetailed('Toyota', 'Camry', 2021, 100000);
        expect(result.factors.mileageAdjustment).toBeLessThan(0);
    });

    it('caps mileage adjustment at ±20%', () => {
        const veryLowMileage = estimateFairPriceDetailed('Toyota', 'Camry', 2010, 10000);
        const veryHighMileage = estimateFairPriceDetailed('Toyota', 'Camry', 2010, 300000);

        expect(veryLowMileage.factors.mileageAdjustment).toBeLessThanOrEqual(0.20);
        expect(veryHighMileage.factors.mileageAdjustment).toBeGreaterThanOrEqual(-0.20);
    });
});

describe('confidence-based range', () => {
    it('has tighter range for high confidence', () => {
        const highConf = estimateFairPriceDetailed('Toyota', 'Camry', 2022, 30000);
        const lowConf = estimateFairPriceDetailed('UnknownMake', 'UnknownModel', 2022, 30000);

        const highRange = (highConf.high - highConf.low) / highConf.midpoint;
        const lowRange = (lowConf.high - lowConf.low) / lowConf.midpoint;

        expect(highRange).toBeLessThan(lowRange);
    });

    it('expands range for old vehicles', () => {
        const newCar = estimateFairPriceDetailed('Toyota', 'Camry', 2022, 30000);
        const oldCar = estimateFairPriceDetailed('Toyota', 'Camry', 2008, 150000);

        const newRange = (newCar.high - newCar.low) / newCar.midpoint;
        const oldRange = (oldCar.high - oldCar.low) / oldCar.midpoint;

        expect(oldRange).toBeGreaterThan(newRange);
    });

    it('expands range for high mileage', () => {
        const lowMiles = estimateFairPriceDetailed('Toyota', 'Camry', 2018, 50000);
        const highMiles = estimateFairPriceDetailed('Toyota', 'Camry', 2018, 180000);

        const lowRange = (lowMiles.high - lowMiles.low) / lowMiles.midpoint;
        const highRange = (highMiles.high - highMiles.low) / highMiles.midpoint;

        expect(highRange).toBeGreaterThan(lowRange);
    });
});

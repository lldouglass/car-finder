import { describe, it, expect } from 'vitest';
import {
    mapBodyClassToCategory,
    getEngineMultiplier,
    getDrivetrainMultiplier,
    getBrandResaleMultiplier,
    getInflationAdjustment,
    estimateMsrp,
    isElectricVehicle,
    isHybridVehicle,
    determineConfidence,
} from './msrp-estimator';

describe('msrp-estimator', () => {
    describe('mapBodyClassToCategory', () => {
        it('should map pickup trucks correctly', () => {
            expect(mapBodyClassToCategory('Pickup Truck', 'Ford')).toBe('pickup');
            expect(mapBodyClassToCategory('Light Duty Truck', 'Toyota')).toBe('pickup');
        });

        it('should map SUVs correctly', () => {
            expect(mapBodyClassToCategory('Sport Utility Vehicle', 'Honda')).toBe('midsize_suv');
            expect(mapBodyClassToCategory('Compact SUV', 'Mazda')).toBe('compact_suv');
            expect(mapBodyClassToCategory('Full-size SUV', 'Chevrolet')).toBe('fullsize_suv');
        });

        it('should map luxury SUVs correctly', () => {
            expect(mapBodyClassToCategory('Sport Utility Vehicle', 'BMW')).toBe('luxury_suv');
            expect(mapBodyClassToCategory('SUV', 'Mercedes-Benz')).toBe('luxury_suv');
            expect(mapBodyClassToCategory('Crossover', 'Lexus')).toBe('luxury_suv');
        });

        it('should map sedans correctly', () => {
            expect(mapBodyClassToCategory('Sedan', 'Toyota')).toBe('sedan');
            expect(mapBodyClassToCategory('Compact Sedan', 'Honda')).toBe('compact');
            expect(mapBodyClassToCategory('Full-size Sedan', 'Chevrolet')).toBe('fullsize_sedan');
        });

        it('should map luxury sedans correctly', () => {
            expect(mapBodyClassToCategory('Sedan', 'BMW')).toBe('luxury_sedan');
            expect(mapBodyClassToCategory('Midsize Sedan', 'Audi')).toBe('luxury_sedan');
        });

        it('should map minivans correctly', () => {
            expect(mapBodyClassToCategory('Minivan', 'Honda')).toBe('minivan');
            expect(mapBodyClassToCategory('Passenger Van', 'Toyota')).toBe('minivan');
        });

        it('should map sports cars correctly', () => {
            expect(mapBodyClassToCategory('Coupe', 'Ford')).toBe('sports');
            expect(mapBodyClassToCategory('Convertible', 'Mazda')).toBe('sports');
            expect(mapBodyClassToCategory('Roadster', 'Porsche')).toBe('sports');
        });

        it('should map hatchbacks correctly', () => {
            expect(mapBodyClassToCategory('Hatchback', 'Volkswagen')).toBe('compact');
        });

        it('should return unknown for undefined body class', () => {
            expect(mapBodyClassToCategory(undefined, 'Toyota')).toBe('unknown');
        });

        it('should default luxury brands to luxury_sedan', () => {
            expect(mapBodyClassToCategory('Unknown', 'Porsche')).toBe('luxury_sedan');
        });
    });

    describe('getEngineMultiplier', () => {
        it('should return correct multiplier for small engines', () => {
            expect(getEngineMultiplier(1.2, undefined)).toBe(0.85);
            expect(getEngineMultiplier(1.5, undefined)).toBe(0.85);
        });

        it('should return correct multiplier for medium engines', () => {
            expect(getEngineMultiplier(1.8, undefined)).toBe(0.95);
            expect(getEngineMultiplier(2.0, undefined)).toBe(0.95);
            expect(getEngineMultiplier(2.4, undefined)).toBe(1.00);
        });

        it('should return correct multiplier for large engines', () => {
            expect(getEngineMultiplier(3.5, undefined)).toBe(1.20);
            expect(getEngineMultiplier(4.5, undefined)).toBe(1.35);
            expect(getEngineMultiplier(6.2, undefined)).toBe(1.50);
        });

        it('should return EV multiplier for electric vehicles', () => {
            expect(getEngineMultiplier(undefined, 'Electric')).toBe(1.25);
            expect(getEngineMultiplier(undefined, 'Battery Electric')).toBe(1.25);
        });

        it('should not use EV multiplier for hybrids', () => {
            expect(getEngineMultiplier(2.5, 'Hybrid Electric')).toBe(1.00);
            expect(getEngineMultiplier(2.0, 'Plug-in Hybrid')).toBe(0.95);
        });

        it('should return default multiplier for unknown displacement', () => {
            expect(getEngineMultiplier(undefined, undefined)).toBe(1.00);
            expect(getEngineMultiplier(0, undefined)).toBe(1.00);
        });
    });

    describe('getDrivetrainMultiplier', () => {
        it('should return correct multiplier for FWD', () => {
            expect(getDrivetrainMultiplier('FWD')).toBe(1.00);
            expect(getDrivetrainMultiplier('Front Wheel Drive')).toBe(1.00);
        });

        it('should return correct multiplier for RWD', () => {
            expect(getDrivetrainMultiplier('RWD')).toBe(1.05);
            expect(getDrivetrainMultiplier('Rear Wheel Drive')).toBe(1.05);
        });

        it('should return correct multiplier for AWD', () => {
            expect(getDrivetrainMultiplier('AWD')).toBe(1.15);
            expect(getDrivetrainMultiplier('All Wheel Drive')).toBe(1.15);
        });

        it('should return correct multiplier for 4WD', () => {
            expect(getDrivetrainMultiplier('4WD')).toBe(1.18);
            expect(getDrivetrainMultiplier('4x4')).toBe(1.18);
        });

        it('should return default multiplier for unknown drivetrain', () => {
            expect(getDrivetrainMultiplier(undefined)).toBe(1.00);
            expect(getDrivetrainMultiplier('Unknown')).toBe(1.00);
        });
    });

    describe('getBrandResaleMultiplier', () => {
        it('should return correct multiplier for high-retention brands', () => {
            expect(getBrandResaleMultiplier('Toyota')).toBe(1.19);
            expect(getBrandResaleMultiplier('Lexus')).toBe(1.13);
            expect(getBrandResaleMultiplier('Honda')).toBe(1.11);
        });

        it('should return correct multiplier for average brands', () => {
            expect(getBrandResaleMultiplier('Hyundai')).toBe(0.95);
            expect(getBrandResaleMultiplier('Chevrolet')).toBe(0.95);
        });

        it('should return correct multiplier for low-retention brands', () => {
            expect(getBrandResaleMultiplier('Chrysler')).toBe(0.71);
            expect(getBrandResaleMultiplier('Dodge')).toBe(0.70);
        });

        it('should return special multiplier for Jeep Wrangler', () => {
            expect(getBrandResaleMultiplier('Jeep', 'Wrangler')).toBe(1.05);
            expect(getBrandResaleMultiplier('Jeep', 'Grand Cherokee')).toBe(0.91);
        });

        it('should return default multiplier for unknown brands', () => {
            expect(getBrandResaleMultiplier('UnknownBrand')).toBe(0.90);
        });

        it('should be case-insensitive', () => {
            expect(getBrandResaleMultiplier('TOYOTA')).toBe(1.19);
            expect(getBrandResaleMultiplier('toyota')).toBe(1.19);
        });
    });

    describe('getInflationAdjustment', () => {
        const currentYear = new Date().getFullYear();

        it('should return 1.0 for current/future years', () => {
            expect(getInflationAdjustment(currentYear)).toBe(1.0);
            expect(getInflationAdjustment(currentYear + 1)).toBe(1.0);
        });

        it('should increase for older years', () => {
            const fiveYearsAgo = currentYear - 5;
            const adjustment = getInflationAdjustment(fiveYearsAgo);
            expect(adjustment).toBeGreaterThan(1.0);
            expect(adjustment).toBeCloseTo(Math.pow(1.03, 5), 4);
        });

        it('should compound correctly over multiple years', () => {
            const tenYearsAgo = currentYear - 10;
            const adjustment = getInflationAdjustment(tenYearsAgo);
            expect(adjustment).toBeCloseTo(Math.pow(1.03, 10), 4);
        });
    });

    describe('estimateMsrp', () => {
        it('should estimate MSRP for a typical sedan', () => {
            const result = estimateMsrp({
                make: 'Toyota',
                year: 2020,
                bodyClass: 'Sedan',
                displacementL: 2.5,
                driveType: 'FWD',
            });

            expect(result.category).toBe('sedan');
            expect(result.depreciationCategory).toBe('mainstream');
            expect(result.estimatedMsrp).toBeGreaterThan(20000);
            expect(result.estimatedMsrp).toBeLessThan(50000);
        });

        it('should estimate higher MSRP for luxury SUVs', () => {
            const sedanResult = estimateMsrp({
                make: 'Honda',
                year: 2022,
                bodyClass: 'Sedan',
                displacementL: 2.0,
            });

            const luxurySuvResult = estimateMsrp({
                make: 'BMW',
                year: 2022,
                bodyClass: 'Sport Utility Vehicle',
                displacementL: 3.0,
                driveType: 'AWD',
            });

            expect(luxurySuvResult.estimatedMsrp).toBeGreaterThan(sedanResult.estimatedMsrp);
            expect(luxurySuvResult.category).toBe('luxury_suv');
        });

        it('should adjust for inflation on older vehicles', () => {
            const newResult = estimateMsrp({
                make: 'Toyota',
                year: 2024,
                bodyClass: 'Sedan',
            });

            const oldResult = estimateMsrp({
                make: 'Toyota',
                year: 2014,
                bodyClass: 'Sedan',
            });

            // Older vehicle should have lower historical MSRP
            expect(oldResult.estimatedMsrp).toBeLessThan(newResult.estimatedMsrp);
        });

        it('should use EV multiplier for electric vehicles', () => {
            const iceResult = estimateMsrp({
                make: 'Tesla',
                year: 2023,
                bodyClass: 'Sedan',
                fuelType: 'Gasoline',
            });

            const evResult = estimateMsrp({
                make: 'Tesla',
                year: 2023,
                bodyClass: 'Sedan',
                fuelType: 'Electric',
            });

            expect(evResult.factors.engineMultiplier).toBe(1.25);
            expect(evResult.estimatedMsrp).toBeGreaterThan(iceResult.estimatedMsrp);
        });
    });

    describe('isElectricVehicle', () => {
        it('should return true for electric vehicles', () => {
            expect(isElectricVehicle('Electric')).toBe(true);
            expect(isElectricVehicle('Battery Electric')).toBe(true);
        });

        it('should return false for hybrids', () => {
            expect(isElectricVehicle('Hybrid Electric')).toBe(false);
            expect(isElectricVehicle('Plug-in Hybrid Electric')).toBe(false);
        });

        it('should return false for ICE vehicles', () => {
            expect(isElectricVehicle('Gasoline')).toBe(false);
            expect(isElectricVehicle('Diesel')).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isElectricVehicle(undefined)).toBe(false);
        });
    });

    describe('isHybridVehicle', () => {
        it('should return true for hybrids', () => {
            expect(isHybridVehicle('Hybrid')).toBe(true);
            expect(isHybridVehicle('Plug-in Hybrid')).toBe(true);
            expect(isHybridVehicle('Hybrid Electric')).toBe(true);
        });

        it('should return false for non-hybrids', () => {
            expect(isHybridVehicle('Electric')).toBe(false);
            expect(isHybridVehicle('Gasoline')).toBe(false);
            expect(isHybridVehicle(undefined)).toBe(false);
        });
    });

    describe('determineConfidence', () => {
        it('should return high confidence when most factors are known', () => {
            expect(determineConfidence(true, true, true, true)).toBe('high');
            expect(determineConfidence(true, true, true, false)).toBe('high');
        });

        it('should return medium confidence when some factors are known', () => {
            expect(determineConfidence(true, true, false, false)).toBe('medium');
            expect(determineConfidence(true, false, true, false)).toBe('medium');
        });

        it('should return low confidence when few factors are known', () => {
            expect(determineConfidence(true, false, false, false)).toBe('low');
            expect(determineConfidence(false, false, false, true)).toBe('low');
        });
    });
});

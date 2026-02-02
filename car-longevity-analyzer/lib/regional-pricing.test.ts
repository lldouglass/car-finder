import { describe, it, expect } from 'vitest';
import {
    getRegionFromState,
    determineVehicleType,
    getVehicleTypeAdjustment,
    calculateRegionalAdjustment,
    applyRegionalAdjustment,
    getAllRegions,
} from './regional-pricing';

describe('regional-pricing', () => {
    describe('getRegionFromState', () => {
        it('should map Pacific states correctly', () => {
            expect(getRegionFromState('CA')).toBe('pacific');
            expect(getRegionFromState('OR')).toBe('pacific');
            expect(getRegionFromState('WA')).toBe('pacific');
            expect(getRegionFromState('california')).toBe('pacific');
        });

        it('should map Mountain states correctly', () => {
            expect(getRegionFromState('CO')).toBe('mountain');
            expect(getRegionFromState('AZ')).toBe('mountain');
            expect(getRegionFromState('UT')).toBe('mountain');
            expect(getRegionFromState('colorado')).toBe('mountain');
        });

        it('should map Midwest states correctly', () => {
            expect(getRegionFromState('IL')).toBe('midwest');
            expect(getRegionFromState('MI')).toBe('midwest');
            expect(getRegionFromState('OH')).toBe('midwest');
            expect(getRegionFromState('illinois')).toBe('midwest');
        });

        it('should map South Central states correctly', () => {
            expect(getRegionFromState('TX')).toBe('south_central');
            expect(getRegionFromState('OK')).toBe('south_central');
            expect(getRegionFromState('LA')).toBe('south_central');
            expect(getRegionFromState('texas')).toBe('south_central');
        });

        it('should map Southeast states correctly', () => {
            expect(getRegionFromState('FL')).toBe('southeast');
            expect(getRegionFromState('GA')).toBe('southeast');
            expect(getRegionFromState('NC')).toBe('southeast');
            expect(getRegionFromState('florida')).toBe('southeast');
        });

        it('should map Northeast states correctly', () => {
            expect(getRegionFromState('NY')).toBe('northeast');
            expect(getRegionFromState('NJ')).toBe('northeast');
            expect(getRegionFromState('MA')).toBe('northeast');
            expect(getRegionFromState('new york')).toBe('northeast');
        });

        it('should return unknown for undefined or unknown states', () => {
            expect(getRegionFromState(undefined)).toBe('unknown');
            expect(getRegionFromState('ZZ')).toBe('unknown');
            expect(getRegionFromState('invalid')).toBe('unknown');
        });

        it('should handle state codes with case normalization', () => {
            // Uppercase codes work via direct mapping
            expect(getRegionFromState('CA')).toBe('pacific');
            // Lowercase 'ca' gets uppercased, which matches the mapping
            expect(getRegionFromState('ca')).toBe('pacific');
        });
    });

    describe('determineVehicleType', () => {
        it('should identify trucks', () => {
            expect(determineVehicleType('Pickup Truck', undefined, undefined)).toBe('truck');
            expect(determineVehicleType('Light Duty Truck', undefined, undefined)).toBe('truck');
        });

        it('should identify SUVs', () => {
            expect(determineVehicleType('Sport Utility Vehicle', undefined, undefined)).toBe('suv');
            expect(determineVehicleType('SUV', undefined, undefined)).toBe('suv');
        });

        it('should identify EVs regardless of body type', () => {
            expect(determineVehicleType('Sedan', 'Electric', undefined)).toBe('ev');
            expect(determineVehicleType('SUV', 'Battery Electric', undefined)).toBe('ev');
        });

        it('should not identify hybrids as EVs', () => {
            expect(determineVehicleType('Sedan', 'Hybrid Electric', undefined)).toBe('sedan');
        });

        it('should identify convertibles', () => {
            expect(determineVehicleType('Convertible', undefined, undefined)).toBe('convertible');
            expect(determineVehicleType('Roadster', undefined, undefined)).toBe('convertible');
        });

        it('should identify AWD vehicles', () => {
            expect(determineVehicleType('Sedan', undefined, 'AWD')).toBe('awd');
            expect(determineVehicleType('Sedan', undefined, 'All Wheel Drive')).toBe('awd');
            expect(determineVehicleType('Sedan', undefined, '4WD')).toBe('awd');
        });

        it('should identify sedans', () => {
            expect(determineVehicleType('Sedan', undefined, 'FWD')).toBe('sedan');
        });

        it('should return other for unknown types', () => {
            expect(determineVehicleType(undefined, undefined, undefined)).toBe('other');
            expect(determineVehicleType('Unknown', undefined, 'FWD')).toBe('other');
        });
    });

    describe('getVehicleTypeAdjustment', () => {
        it('should return positive adjustment for trucks in mountain region', () => {
            expect(getVehicleTypeAdjustment('mountain', 'truck')).toBe(0.05);
        });

        it('should return positive adjustment for EVs in pacific region', () => {
            expect(getVehicleTypeAdjustment('pacific', 'ev')).toBe(0.05);
        });

        it('should return negative adjustment for EVs in midwest', () => {
            expect(getVehicleTypeAdjustment('midwest', 'ev')).toBe(-0.05);
        });

        it('should return positive adjustment for AWD in northeast', () => {
            expect(getVehicleTypeAdjustment('northeast', 'awd')).toBe(0.05);
        });

        it('should return negative adjustment for convertibles in midwest', () => {
            expect(getVehicleTypeAdjustment('midwest', 'convertible')).toBe(-0.03);
        });

        it('should return 0 for vehicle types without adjustments', () => {
            expect(getVehicleTypeAdjustment('pacific', 'sedan')).toBe(0);
            expect(getVehicleTypeAdjustment('south_central', 'sedan')).toBe(0);
        });
    });

    describe('calculateRegionalAdjustment', () => {
        it('should calculate correct adjustment for Pacific region', () => {
            const result = calculateRegionalAdjustment('CA', 'Sedan', 'Gasoline', 'FWD');
            expect(result.region).toBe('pacific');
            expect(result.baseMultiplier).toBe(1.08);
            expect(result.vehicleTypeAdjustment).toBe(0);
            expect(result.totalMultiplier).toBe(1.08);
        });

        it('should calculate correct adjustment for Midwest region', () => {
            const result = calculateRegionalAdjustment('IL', 'Sedan', 'Gasoline', 'FWD');
            expect(result.region).toBe('midwest');
            expect(result.baseMultiplier).toBe(0.95);
            expect(result.totalMultiplier).toBe(0.95);
        });

        it('should include vehicle type adjustment', () => {
            const result = calculateRegionalAdjustment('CO', 'Pickup Truck', 'Gasoline', '4WD');
            expect(result.region).toBe('mountain');
            expect(result.baseMultiplier).toBe(1.02);
            // Truck adjustment is 0.05
            expect(result.vehicleTypeAdjustment).toBe(0.05);
            expect(result.totalMultiplier).toBe(1.07);
        });

        it('should handle EV adjustment', () => {
            const evPacific = calculateRegionalAdjustment('CA', 'Sedan', 'Electric', 'FWD');
            expect(evPacific.vehicleTypeAdjustment).toBe(0.05);
            expect(evPacific.totalMultiplier).toBeCloseTo(1.13, 5);

            const evMidwest = calculateRegionalAdjustment('IL', 'Sedan', 'Electric', 'FWD');
            expect(evMidwest.vehicleTypeAdjustment).toBe(-0.05);
            expect(evMidwest.totalMultiplier).toBeCloseTo(0.90, 5);
        });

        it('should return baseline for unknown region', () => {
            const result = calculateRegionalAdjustment(undefined, 'Sedan', 'Gasoline', 'FWD');
            expect(result.region).toBe('unknown');
            expect(result.baseMultiplier).toBe(1.00);
            expect(result.totalMultiplier).toBe(1.00);
        });

        it('should include explanation in result', () => {
            const result = calculateRegionalAdjustment('CA', 'Sedan', 'Electric', 'FWD');
            expect(result.explanation).toContain('emissions');
            expect(result.explanation).toContain('Electric vehicles');
        });
    });

    describe('applyRegionalAdjustment', () => {
        it('should apply multiplier to price', () => {
            const adjustment = {
                region: 'pacific' as const,
                regionName: 'Pacific',
                baseMultiplier: 1.08,
                vehicleTypeAdjustment: 0.05,
                totalMultiplier: 1.13,
                explanation: 'Test',
            };

            const result = applyRegionalAdjustment(10000, adjustment);
            expect(result).toBe(11300);
        });

        it('should round to nearest dollar', () => {
            const adjustment = {
                region: 'midwest' as const,
                regionName: 'Midwest',
                baseMultiplier: 0.95,
                vehicleTypeAdjustment: 0,
                totalMultiplier: 0.95,
                explanation: 'Test',
            };

            const result = applyRegionalAdjustment(10001, adjustment);
            expect(result).toBe(9501);
        });
    });

    describe('getAllRegions', () => {
        it('should return all regions except unknown', () => {
            const regions = getAllRegions();
            expect(regions.length).toBe(6);
            expect(regions.find(r => r.region === 'unknown')).toBeUndefined();
        });

        it('should include region names and multipliers', () => {
            const regions = getAllRegions();
            const pacific = regions.find(r => r.region === 'pacific');
            expect(pacific).toBeDefined();
            expect(pacific!.name).toContain('Pacific');
            expect(pacific!.multiplier).toBe(1.08);
        });
    });
});

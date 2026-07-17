import { describe, it, expect } from 'vitest';
import { resolveVehicleFromText } from './blog-vehicle';

describe('resolveVehicleFromText', () => {
    it('matches a model-specific post title with punctuated model name', () => {
        expect(
            resolveVehicleFromText(
                'How Long Does a Mazda CX-5 Last? Complete Reliability Guide how-long-does-mazda-cx5-last'
            )
        ).toEqual({ make: 'Mazda', model: 'CX-5' });
    });

    it('matches a slug-style hyphenated title', () => {
        expect(
            resolveVehicleFromText('How Long Does a Toyota 4Runner Last how-long-does-toyota-4runner-last')
        ).toEqual({ make: 'Toyota', model: '4Runner' });
    });

    it('returns null for roundup posts mentioning several vehicles', () => {
        expect(
            resolveVehicleFromText('Toyota Camry vs Honda Accord: which lasts longer?')
        ).toBeNull();
    });

    it('returns null for generic posts with no vehicle', () => {
        expect(resolveVehicleFromText('How Long Will My Car Last? how-long-will-my-car-last')).toBeNull();
        expect(resolveVehicleFromText('Most Reliable Trucks 2026 most-reliable-trucks-2026')).toBeNull();
    });

    it('prefers the longer model when one contains the other', () => {
        const result = resolveVehicleFromText('Subaru Outback reliability by year');
        expect(result).toEqual({ make: 'Subaru', model: 'Outback' });
    });

    it('does not match a model across token boundaries', () => {
        // "costs-10-year" must not match Chevrolet S-10
        expect(
            resolveVehicleFromText('Ford vs Chevrolet Maintenance Costs 10 Year ford-vs-chevy-maintenance-costs-10-year-2026')
        ).toBeNull();
    });

    it('returns null for head-to-head comparison posts', () => {
        expect(
            resolveVehicleFromText('Ford F-150 vs Chevy Trucks Reliability ford-vs-chevy-trucks-reliability-2026')
        ).toBeNull();
    });
});

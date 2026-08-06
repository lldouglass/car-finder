import { describe, it, expect } from 'vitest';
import { gatePremiumAnalysis, PREMIUM_ANALYSIS_FIELDS } from './premium-gate';

const fullPayload = {
    success: true,
    vehicle: { year: 2015, make: 'Honda', model: 'Accord' },
    scores: { reliability: 8.1 },
    recalls: [{ id: 'r1' }],
    pricing: { askingPrice: 15000, fairPriceLow: 10245, fairPriceHigh: 12027 },
    negotiationStrategy: { suggestedOffer: 11527, points: [] },
    maintenanceCost: { projections: [] },
    maintenanceCosts: { annual: 500 },
    inspectionChecklist: { vehicleSpecificItems: [] },
    warrantyValue: { score: 3 },
    priceThresholds: { good: 11000 },
};

describe('gatePremiumAnalysis', () => {
    it('returns the payload untouched for Buyer Pass holders', () => {
        const result = gatePremiumAnalysis(fullPayload, true);
        expect(result).toBe(fullPayload);
        expect('premiumLocked' in result).toBe(false);
    });

    it('strips every premium field for non-holders', () => {
        const result = gatePremiumAnalysis(fullPayload, false);
        for (const field of PREMIUM_ANALYSIS_FIELDS) {
            expect(result).not.toHaveProperty(field);
        }
    });

    it('marks gated responses and keeps the free fields', () => {
        const result = gatePremiumAnalysis(fullPayload, false);
        expect(result).toMatchObject({
            success: true,
            premiumLocked: true,
            vehicle: fullPayload.vehicle,
            scores: fullPayload.scores,
            recalls: fullPayload.recalls,
        });
    });

    it('does not mutate the original payload', () => {
        gatePremiumAnalysis(fullPayload, false);
        expect(fullPayload.negotiationStrategy).toBeDefined();
        expect(fullPayload.pricing).toBeDefined();
    });
});

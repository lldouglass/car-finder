import { describe, it, expect } from 'vitest';
import { sanitizeSharedAnalysis, ShareValidationError, MAX_SHARE_PAYLOAD_BYTES } from './share-payload';
import { PREMIUM_ANALYSIS_FIELDS } from './premium-gate';

const REAL_ANALYSIS = {
    success: true,
    vehicle: { year: 2018, make: 'Subaru', model: 'Outback' },
    scores: { reliability: 7.6 },
    recommendation: { verdict: 'BUY', summary: 'Solid choice' },
    knownIssues: [{ description: 'CVT shudder', severity: 'MODERATE' }],
};

describe('sanitizeSharedAnalysis', () => {
    it('keeps the free analysis fields', () => {
        const result = sanitizeSharedAnalysis(REAL_ANALYSIS);
        expect(result.vehicle).toEqual({ year: 2018, make: 'Subaru', model: 'Outback' });
        expect(result.recommendation).toBeDefined();
        expect(result.knownIssues).toBeDefined();
    });

    it('strips every paid field even when the client sends them', () => {
        const withPaid = {
            ...REAL_ANALYSIS,
            pricing: { fairPriceLow: 10000 },
            negotiationStrategy: { points: ['offer 10% under'] },
            inspectionChecklist: { items: ['check head gaskets'] },
            maintenanceCost: { total: 3000 },
            maintenanceCosts: { total: 3000 },
            warrantyValue: { value: 500 },
            priceThresholds: { walkAway: 12000 },
        };
        const result = sanitizeSharedAnalysis(withPaid);
        for (const field of PREMIUM_ANALYSIS_FIELDS) {
            expect(result[field], `${field} must not be shareable`).toBeUndefined();
        }
        expect(result.premiumLocked).toBe(true);
    });

    it('drops unknown attacker-supplied keys', () => {
        const result = sanitizeSharedAnalysis({
            ...REAL_ANALYSIS,
            phishingHtml: '<a href="evil">click</a>',
            junk: 'A'.repeat(1000),
        });
        expect(result.phishingHtml).toBeUndefined();
        expect(result.junk).toBeUndefined();
    });

    it('rejects non-objects and junk payloads', () => {
        expect(() => sanitizeSharedAnalysis(null)).toThrow(ShareValidationError);
        expect(() => sanitizeSharedAnalysis('nope')).toThrow(ShareValidationError);
        expect(() => sanitizeSharedAnalysis([1, 2, 3])).toThrow(ShareValidationError);
        expect(() => sanitizeSharedAnalysis({ junk: 'A'.repeat(50_000) })).toThrow(ShareValidationError);
    });

    it('rejects payloads over the size cap', () => {
        const huge = {
            ...REAL_ANALYSIS,
            knownIssues: [{ description: 'x'.repeat(MAX_SHARE_PAYLOAD_BYTES + 1000) }],
        };
        expect(() => sanitizeSharedAnalysis(huge)).toThrow(ShareValidationError);
    });
});

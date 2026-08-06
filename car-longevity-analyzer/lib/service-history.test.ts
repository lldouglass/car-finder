import { describe, it, expect } from 'vitest';
import { analyzeServiceHistory, inferMaintenanceQuality, parseServiceHistory } from './service-history';

const OUTBACK_ISSUES = [
    { description: 'Head gasket failures on 2.5L EJ25 engines - external oil and coolant leaks' },
    { description: 'CVT transmission shudder and hesitation' },
    { description: 'Excessive oil consumption in FB25 engines' },
];

describe('parseServiceHistory', () => {
    it('recognizes common services in casual owner language', () => {
        const recognized = parseServiceHistory(
            'head gaskets done at 120k, timing belt and water pump replaced, new brakes all around'
        );
        const labels = recognized.map((r) => r.label);
        expect(labels).toContain('Head gasket replaced');
        expect(labels).toContain('Timing belt/chain service');
        expect(labels).toContain('Water pump replaced');
        expect(labels).toContain('Brake service');
    });

    it('recognizes documented-maintenance signals', () => {
        expect(parseServiceHistory('full service records, dealer maintained').map((r) => r.label))
            .toContain('Documented maintenance');
    });

    it('recognizes nothing in unrelated text', () => {
        expect(parseServiceHistory('great car, drives smooth, cold AC vibes')).toHaveLength(0);
    });
});

describe('inferMaintenanceQuality', () => {
    it('is null with no recognized work', () => {
        expect(inferMaintenanceQuality([])).toBeNull();
    });

    it('is good with one substantive service', () => {
        expect(inferMaintenanceQuality(parseServiceHistory('new brakes'))).toBe('good');
    });

    it('is excellent with records plus multiple services', () => {
        expect(
            inferMaintenanceQuality(
                parseServiceHistory('service records, timing belt done, new tires')
            )
        ).toBe('excellent');
    });
});

describe('analyzeServiceHistory', () => {
    it('returns null for empty input', () => {
        expect(analyzeServiceHistory(undefined, OUTBACK_ISSUES)).toBeNull();
        expect(analyzeServiceHistory('   ', OUTBACK_ISSUES)).toBeNull();
    });

    it('marks the specific known issue addressed by the stated work', () => {
        const result = analyzeServiceHistory('head gaskets replaced last year', OUTBACK_ISSUES);
        expect(result!.addressedIssueDescriptions).toEqual([
            'Head gasket failures on 2.5L EJ25 engines - external oil and coolant leaks',
        ]);
    });

    it('does not mark unrelated issues addressed', () => {
        const result = analyzeServiceHistory('new brakes and tires', OUTBACK_ISSUES);
        expect(result!.addressedIssueDescriptions).toHaveLength(0);
    });

    it('engine replacement addresses engine-family issues including oil consumption', () => {
        const result = analyzeServiceHistory('engine replaced at 150k', OUTBACK_ISSUES);
        expect(result!.addressedIssueDescriptions).toContain('Excessive oil consumption in FB25 engines');
    });
});

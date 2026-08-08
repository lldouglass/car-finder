import { describe, it, expect } from 'vitest';
import { extractKnownIssues } from './complaint-analyzer';
import type { Complaint } from './nhtsa';

function makeComplaint(overrides: Partial<Complaint> = {}): Complaint {
    return {
        Component: 'ENGINE',
        Summary: 'THE ENGINE STALLED WHILE DRIVING.',
        DateOfIncident: '2020-01-01',
        Crash: false,
        Fire: false,
        Injuries: 0,
        Deaths: 0,
        Vin: undefined,
        ...overrides,
    };
}

describe('extractKnownIssues', () => {
    it('groups complaints by component and reports counts', () => {
        const complaints = Array.from({ length: 4 }, (_, i) =>
            makeComplaint({ Summary: `COMPLAINT NUMBER ${i} ABOUT A STALLING ENGINE.` })
        );

        const issues = extractKnownIssues(complaints);

        expect(issues).toHaveLength(1);
        expect(issues[0].component).toBe('ENGINE');
        expect(issues[0].complaintCount).toBe(4);
    });

    it('skips components with fewer than three complaints', () => {
        expect(extractKnownIssues([makeComplaint(), makeComplaint()])).toEqual([]);
    });

    it('strips control characters out of sample complaints', () => {
        // NHTSA free text carries raw CR/LF and stray C0 bytes; a summary like
        // this is what produced unparseable escape noise in the API response.
        const complaints = [
            makeComplaint({ Summary: 'THE VEHICLE LOST POWER.\r\n\r\nTHE DEALER FOUND NOTHING.' }),
            makeComplaint({ Summary: '\u0000TRANSMISSION SLIPPED\u001f BETWEEN GEARS.\u0007' }),
            makeComplaint({ Summary: 'CHECK ENGINE LIGHT CAME ON\u007f AT 60 MPH.' }),
        ];

        const [issue] = extractKnownIssues(complaints);

        expect(issue.sampleComplaints).toEqual([
            'THE VEHICLE LOST POWER. THE DEALER FOUND NOTHING.',
            'TRANSMISSION SLIPPED BETWEEN GEARS.',
            'CHECK ENGINE LIGHT CAME ON AT 60 MPH.',
        ]);

        for (const sample of issue.sampleComplaints) {
            expect(/[\x00-\x1f\x7f]/.test(sample)).toBe(false);
        }
    });

    it('serializes to JSON that strict parsers accept', () => {
        const complaints = Array.from({ length: 3 }, (_, i) =>
            makeComplaint({ Summary: `AIRBAG FAULT ${i}.\r\nDASH LIGHT STAYED ON.\u0016` })
        );

        const serialized = JSON.stringify(extractKnownIssues(complaints));

        // No control-character escape sequences survive into the payload
        expect(serialized).not.toMatch(/\\[rnt]|\\u00[01][0-9a-f]/i);
        expect(() => JSON.parse(serialized)).not.toThrow();
    });

    it('drops complaints whose summary is nothing but control characters', () => {
        const complaints = [
            makeComplaint({ Summary: '\r\n\u0000\u0007' }),
            makeComplaint({ Summary: 'BRAKES FAILED ON A STEEP GRADE.' }),
            makeComplaint({ Summary: 'PEDAL WENT TO THE FLOOR WITH NO RESISTANCE.' }),
        ];

        const [issue] = extractKnownIssues(complaints);

        expect(issue.complaintCount).toBe(3);
        expect(issue.sampleComplaints).toEqual([
            'BRAKES FAILED ON A STEEP GRADE.',
            'PEDAL WENT TO THE FLOOR WITH NO RESISTANCE.',
        ]);
    });
});

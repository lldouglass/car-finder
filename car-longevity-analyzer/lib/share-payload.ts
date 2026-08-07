import { PREMIUM_ANALYSIS_FIELDS } from './premium-gate';

/**
 * Top-level keys a shared report may persist. Anything else a client sends is
 * dropped, so /api/share cannot be used to publish arbitrary attacker-authored
 * content on our domain.
 */
const SHAREABLE_FIELDS = [
    'success',
    'analysisType',
    'vehicle',
    'scores',
    'longevity',
    'lifespanAnalysis',
    'expectedLifespan',
    'reliabilityAnalysis',
    'knownIssues',
    'serviceHistory',
    'componentIssues',
    'recalls',
    'redFlags',
    'aiAnalysis',
    'recommendation',
    'safetyRating',
    'survivalAnalysis',
] as const;

/** Serialized size cap for a stored report (generous for real analyses). */
export const MAX_SHARE_PAYLOAD_BYTES = 256 * 1024;

export class ShareValidationError extends Error {}

/**
 * Reduce a client-supplied analysis to a safe, storable shape.
 *
 * Paid fields are removed before persistence — a shared link always shows the
 * free version, so a Buyer Pass holder cannot (accidentally or otherwise)
 * republish the paid report to the public.
 */
export function sanitizeSharedAnalysis(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ShareValidationError('analysisData must be an object');
    }

    const source = input as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const field of SHAREABLE_FIELDS) {
        if (source[field] !== undefined) {
            sanitized[field] = source[field];
        }
    }

    // Defensive: SHAREABLE_FIELDS excludes these, but keep the invariant explicit
    // so adding a field to the whitelist can never reintroduce the paywall leak.
    for (const premiumField of PREMIUM_ANALYSIS_FIELDS) {
        delete sanitized[premiumField];
    }
    sanitized.premiumLocked = true;

    if (!sanitized.vehicle && !sanitized.recommendation && !sanitized.scores) {
        throw new ShareValidationError('analysisData does not look like a vehicle analysis');
    }

    const size = Buffer.byteLength(JSON.stringify(sanitized), 'utf8');
    if (size > MAX_SHARE_PAYLOAD_BYTES) {
        throw new ShareValidationError('analysisData exceeds maximum size');
    }

    return sanitized;
}

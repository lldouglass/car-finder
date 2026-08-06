/**
 * Server-side gate for Buyer Pass content on VIN and listing analyses.
 *
 * The client renders whatever fields exist in the response, so paid analysis
 * must be omitted here at the API boundary — hiding it in the UI would leave
 * the full report readable in the network tab (or by any direct API caller).
 */

export const PREMIUM_ANALYSIS_FIELDS = [
    'pricing',
    'negotiationStrategy',
    'maintenanceCost',
    'maintenanceCosts',
    'inspectionChecklist',
    'warrantyValue',
    'priceThresholds',
] as const;

export type PremiumAnalysisField = (typeof PREMIUM_ANALYSIS_FIELDS)[number];

/**
 * Returns the payload untouched for Buyer Pass holders. For everyone else
 * (anonymous and free accounts), strips the paid fields and marks the
 * response so the client renders the locked Buyer Pass preview cards.
 */
export function gatePremiumAnalysis<T extends Record<string, unknown>>(
    payload: T,
    hasActiveBuyerPass: boolean
): T | (Omit<T, PremiumAnalysisField> & { premiumLocked: true }) {
    if (hasActiveBuyerPass) {
        return payload;
    }

    const gated = { ...payload } as Record<string, unknown>;
    for (const field of PREMIUM_ANALYSIS_FIELDS) {
        delete gated[field];
    }
    gated.premiumLocked = true;
    return gated as Omit<T, PremiumAnalysisField> & { premiumLocked: true };
}

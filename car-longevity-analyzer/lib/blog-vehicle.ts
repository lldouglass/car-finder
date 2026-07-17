import { RELIABILITY_DATA } from './reliability-data';

export interface BlogVehicle {
    make: string;
    model: string;
}

// Models shorter than this after normalization ("3", "86") match too easily in
// unrelated titles, so those posts fall back to the generic CTA.
const MIN_MODEL_LENGTH = 3;
// A model name never spans more than this many tokens ("Grand Cherokee L").
const MAX_TOKEN_SPAN = 4;

function normalize(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function tokenize(text: string): string[] {
    return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * True when `target` (already normalized) equals some run of consecutive
 * tokens joined together. Token boundaries prevent substring artifacts like
 * "S-10" matching inside "costs-10-year".
 */
function containsTokenRun(tokens: string[], target: string): boolean {
    for (let start = 0; start < tokens.length; start++) {
        let joined = '';
        for (let end = start; end < Math.min(start + MAX_TOKEN_SPAN, tokens.length); end++) {
            joined += tokens[end];
            if (joined === target) return true;
            if (joined.length >= target.length) break;
        }
    }
    return false;
}

/**
 * Detect which vehicle a blog post is about by matching the post's title and
 * slug against the reliability database. Returns null when no single vehicle
 * is clearly the subject (brand roundups, comparisons, general guides).
 */
export function resolveVehicleFromText(text: string): BlogVehicle | null {
    const tokens = tokenize(text);
    if (tokens.length === 0) return null;

    // "X vs Y" posts are about two vehicles — never pin a single-model CTA
    if (tokens.includes('vs') || tokens.includes('versus')) return null;

    const matches = RELIABILITY_DATA
        .filter((entry) => {
            const normModel = normalize(entry.model);
            if (normModel.length < MIN_MODEL_LENGTH) return false;
            return (
                containsTokenRun(tokens, normalize(entry.make)) &&
                containsTokenRun(tokens, normModel)
            );
        })
        .sort((a, b) => normalize(b.model).length - normalize(a.model).length);

    // Drop matches whose model is a substring of a longer match (Golf vs Golf GTI)
    const kept: BlogVehicle[] = [];
    for (const match of matches) {
        const normModel = normalize(match.model);
        if (!kept.some((k) => normalize(k.model).includes(normModel))) {
            kept.push({ make: match.make, model: match.model });
        }
    }

    // Roundups mention several vehicles — no single subject
    if (kept.length !== 1) return null;
    return kept[0];
}

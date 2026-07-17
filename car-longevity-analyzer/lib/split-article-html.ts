// Articles shorter than this read as one screen — a mid-article CTA would dominate them.
const MIN_SPLIT_LENGTH = 3000;
// Keep the split away from the very start and end so both chunks feel substantial.
const EARLIEST_SPLIT = 0.2;
const LATEST_SPLIT = 0.75;
const TARGET_SPLIT = 0.45;

/**
 * Split rendered article HTML into two chunks so a CTA can be injected
 * mid-article. Prefers an <h2> boundary near 45% of the content, falling back
 * to a paragraph boundary. Returns [html, null] when the article is too short
 * or has no clean boundary in the allowed window.
 */
export function splitArticleHtml(content: string): [string, string | null] {
    if (content.length < MIN_SPLIT_LENGTH) return [content, null];

    const target = Math.floor(content.length * TARGET_SPLIT);

    const headings = [...content.matchAll(/<h2[\s>]/g)]
        .map((match) => match.index)
        .filter((index): index is number => index !== undefined && index > 0);

    let best: number | null = null;
    for (const index of headings) {
        if (best === null || Math.abs(index - target) < Math.abs(best - target)) {
            best = index;
        }
    }
    if (
        best !== null &&
        best > content.length * EARLIEST_SPLIT &&
        best < content.length * LATEST_SPLIT
    ) {
        return [content.slice(0, best), content.slice(best)];
    }

    const paragraphEnd = content.indexOf('</p>', target);
    if (paragraphEnd !== -1 && paragraphEnd < content.length * LATEST_SPLIT) {
        const cut = paragraphEnd + '</p>'.length;
        return [content.slice(0, cut), content.slice(cut)];
    }

    return [content, null];
}

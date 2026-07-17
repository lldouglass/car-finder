import { describe, it, expect } from 'vitest';
import { splitArticleHtml } from './split-article-html';

function makeHtml(sections: number, sectionLength = 900): string {
    let html = '<p>Intro paragraph about the vehicle and what to expect.</p>';
    for (let i = 1; i <= sections; i++) {
        html += `<h2>Section ${i}</h2><p>${'x'.repeat(sectionLength)}</p>`;
    }
    return html;
}

describe('splitArticleHtml', () => {
    it('does not split short articles', () => {
        const html = makeHtml(2, 200);
        expect(splitArticleHtml(html)).toEqual([html, null]);
    });

    it('splits long articles at an h2 boundary near the middle', () => {
        const html = makeHtml(6);
        const [first, second] = splitArticleHtml(html);
        expect(second).not.toBeNull();
        expect(first + second).toBe(html);
        expect(second!.startsWith('<h2')).toBe(true);
        const ratio = first.length / html.length;
        expect(ratio).toBeGreaterThan(0.2);
        expect(ratio).toBeLessThan(0.75);
    });

    it('falls back to a paragraph boundary when there are no h2s in range', () => {
        const html = `<p>${'a'.repeat(2000)}</p><p>${'b'.repeat(2000)}</p><p>${'c'.repeat(2000)}</p>`;
        const [first, second] = splitArticleHtml(html);
        expect(second).not.toBeNull();
        expect(first.endsWith('</p>')).toBe(true);
        expect(first + second).toBe(html);
    });
});

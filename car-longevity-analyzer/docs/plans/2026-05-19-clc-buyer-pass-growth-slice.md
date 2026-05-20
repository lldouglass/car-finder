# CLC Buyer Pass Growth Slice Implementation Plan

> **For Hermes:** Use subagent-driven-development / delegated builder lane to implement this scoped slice.

**Goal:** Increase Car Lifespan Check Buyer Pass purchases by improving high-intent blog CTR and making the blog/free-check path push buyers toward the $12 VIN decision report.

**Architecture:** Keep the slice small and reversible. Improve existing pages that already have Google impressions instead of spraying new thin content. Add buyer-risk CTA surfaces that send shoppers to the free tool and pricing page, then tighten the wording on existing Buyer Pass upgrade buttons.

**Tech Stack:** Next.js App Router, Markdown blog frontmatter/content in `content/blog`, React components, TypeScript, Vercel deployment.

---

## Evidence from current audit

- Latest production revenue audit found 6 paid CLC Buyer Pass purchases, 4 active Buyer Pass users, and $72 gross counted Buyer Pass revenue.
- Current price: $12 one-time for 30 days.
- Stale-but-useful Search Console pull from 2026-05-05 shows CLC impressions up but CTR low: recent 7d 11 clicks / 3320 impressions / 0.33% CTR / avg pos 12.08.
- Highest CLC CTR opportunities from GSC:
  - `/blog/toyota-tundra-engine-reliability-57-vs-46-vs-35-twin-turbo-2026` — 1711 impressions, 0.41% CTR, pos 9.31
  - `/blog/most-reliable-cars-under-15k` — 1154 impressions, 0.09% CTR, pos 6.95
  - `/blog/best-used-cars-under-10k-2026` — 780 impressions, 0.13% CTR, pos 8.19
  - `/blog/most-reliable-used-cars-under-25k-2026` — 492 impressions, 0.20% CTR, pos 5.81
  - `/blog/best-used-suvs-under-20k-2026` — 490 impressions, 0.00% CTR, pos 4.72
  - `/blog/most-reliable-car-brands-2026` — 402 impressions, 0.00% CTR, pos 5.78
  - `/blog/used-car-reliability-hub-2026` — 147 impressions, 0.00% CTR, pos 5.61
- Existing blog CTA is generic: “Check Your Car's Lifespan Free” / “Try the Analysis Tool”. It does not explicitly frame the $12 Buyer Pass as protection before handing over cash.

## Non-goals for this slice

- Do not build a full email capture system yet.
- Do not add a new payment tier yet.
- Do not create a large batch of thin SEO pages.
- Do not change Stripe/payment logic.
- Do not touch `.env`.

## Task 1: Add a purchase-oriented blog CTA component

**Objective:** Replace generic blog CTAs with buyer-decision copy that routes shoppers to both the free check and Buyer Pass pricing.

**Files:**
- Create: `components/marketing/blog-buyer-pass-cta.tsx`
- Modify: `app/(marketing)/blog/[slug]/page.tsx`

**Implementation notes:**
- Component should use `Link` from `next/link`.
- Top banner copy should say something like: “Shopping a specific used car? Run the free check, then unlock the $12 Buyer Pass before you buy.”
- Include two actions: primary to `/` (`Run a free check`) and secondary to `/pricing` (`See Buyer Pass`).
- Bottom card should mention fair price range, negotiation notes, maintenance outlook, and pre-purchase checklist.
- Keep styling consistent with current blue/amber palette.

**Verification:**
- Blog pages render without hydration errors.
- Browser snapshot shows both free-check and Buyer Pass links on a blog page.

## Task 2: Tighten existing Buyer Pass CTA button labels

**Objective:** Shift button copy from generic “Unlock Buyer Pass” to the user’s actual buying anxiety.

**Files:**
- Modify: `components/inline-vin-upsell.tsx`
- Modify if needed: `app/(marketing)/pricing/page.tsx`

**Implementation notes:**
- Signed-in CTA examples:
  - `Check the VIN before you buy — $12`
  - `Unlock the buyer report — $12`
- Keep “one-time, 30 days, no subscription” visible.
- Do not change checkout behavior.

**Verification:**
- TypeScript passes.
- Live homepage/pricing page CTAs remain visible and clickable.

## Task 3: Improve CTR metadata on existing high-impression pages

**Objective:** Update frontmatter title/description and first-screen intro on the top pages where Search Console shows impressions but weak CTR.

**Files:**
- Modify: `content/blog/most-reliable-cars-under-15k.md`
- Modify: `content/blog/best-used-cars-under-10k-2026.md`
- Modify: `content/blog/most-reliable-used-cars-under-25k-2026.md`
- Modify: `content/blog/best-used-suvs-under-20k-2026.md`
- Modify: `content/blog/most-reliable-car-brands-2026.md`

**Implementation notes:**
- Do not rewrite entire articles. Update title/description and the opening 1-3 paragraphs to be answer-first and more click-worthy.
- Add a buyer-decision sentence near the top of each: “If you already have a listing, run the free check and use Buyer Pass for VIN-specific pricing/negotiation before you buy.”
- Keep title under roughly 60-70 characters where practical.
- Avoid unsupported claims and fake precision.

**Verification:**
- Re-read each changed file.
- Confirm frontmatter still parses.
- Confirm pages generate in build.

## Task 4: Add FAQPage JSON-LD to pricing page

**Objective:** Improve search/AI readability for the Buyer Pass pricing page.

**Files:**
- Modify: `app/(marketing)/pricing/page.tsx`

**Implementation notes:**
- Reuse `buyerPassFaqs` to emit a `FAQPage` JSON-LD script.
- Use canonical URL `https://www.carlifespancheck.com/pricing`.
- Do not change visible pricing or checkout behavior.

**Verification:**
- Build passes.
- Inspect page source or browser DOM for `FAQPage` JSON-LD.

## Task 5: Validate, commit, deploy, and verify production

**Commands:**

```bash
cd /Users/Hermes/workspace/projects/car-finder-repo/car-longevity-analyzer
npx tsc --noEmit
npm run build
git diff --check
git status --short
```

**If clean:**

```bash
git add components/marketing/blog-buyer-pass-cta.tsx app/(marketing)/blog/[slug]/page.tsx app/(marketing)/pricing/page.tsx components/inline-vin-upsell.tsx content/blog/*.md docs/plans/2026-05-19-clc-buyer-pass-growth-slice.md
git commit -m "feat: improve CLC buyer pass growth funnel"
git push origin main
```

**Production verification:**
- Open `https://www.carlifespancheck.com/`.
- Open `https://www.carlifespancheck.com/pricing`.
- Open one changed blog page, e.g. `/blog/most-reliable-cars-under-15k`.
- Check browser console for errors.
- Verify CTAs link to `/` and `/pricing`.
- Confirm no blank pages.

## Reporting

Final report should include:
- Exact pages changed.
- Local checks run and outcome.
- Deployment status.
- Production URLs verified.
- Next recommended slice: email capture + 5 more GSC-backed CTR/content updates, or instrumentation if funnel data is missing.

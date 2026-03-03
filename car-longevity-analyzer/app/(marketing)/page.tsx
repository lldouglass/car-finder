import type { Metadata } from 'next';
import Link from 'next/link';
import HomeAppLoader from '@/components/home-app-loader';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

/**
 * Homepage
 *
 * Keep the interactive app first (so UX is unchanged), but include
 * compact SSR content below for search engines to crawl.
 */
export default function Home() {
  return (
    <>
      <HomeAppLoader />

      {/* Compact crawlable content (below fold, not a giant top banner) */}
      <section className="border-t bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">
            How Long Will My Car Last?
          </h1>
          <p className="text-muted-foreground mb-5 max-w-3xl">
            Car Lifespan Check gives you a free reliability analysis using NHTSA complaint data,
            recall history, and model-year patterns. Check any car by year, make, and model,
            then compare safer long-term options by budget.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border bg-white dark:bg-zinc-900 p-3">
              <p className="font-semibold mb-1">Lifespan prediction</p>
              <p className="text-muted-foreground">Estimated mileage range and durability outlook.</p>
            </div>
            <div className="rounded-lg border bg-white dark:bg-zinc-900 p-3">
              <p className="font-semibold mb-1">Recall and complaint check</p>
              <p className="text-muted-foreground">Open recalls, complaint volume, and common issues.</p>
            </div>
            <div className="rounded-lg border bg-white dark:bg-zinc-900 p-3">
              <p className="font-semibold mb-1">Reliability score</p>
              <p className="text-muted-foreground">Data-driven score to compare options quickly.</p>
            </div>
          </div>

          <div className="mt-5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Explore:</span>{' '}
            <Link href="/browse" className="underline hover:no-underline">Browse by Budget</Link>{' · '}
            <Link href="/explore" className="underline hover:no-underline">Explore All Cars</Link>{' · '}
            <Link href="/blog" className="underline hover:no-underline">Reliability Blog</Link>{' · '}
            <Link href="/guide" className="underline hover:no-underline">Buying Guide</Link>
          </div>
        </div>
      </section>
    </>
  );
}

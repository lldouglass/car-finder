import type { Metadata } from 'next';
import Link from 'next/link';
import HomeAppLoader from '@/components/home-app-loader';
import { SiteFooter } from '@/components/marketing/site-footer';
import { BUYER_PASS_OFFER, buyerPassComparison } from '@/lib/buyer-pass';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

const comparisonPreview = buyerPassComparison.slice(0, 4);

/**
 * Homepage
 *
 * Keep the interactive app first so the main experience stays unchanged,
 * then include crawlable marketing content below it for SEO and pricing intent.
 */
export default function Home() {
  return (
    <>
      <HomeAppLoader />

      <section className="border-t bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
          <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-zinc-900 sm:p-8">
            <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              Free car checks + Buyer Pass
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Check a car for free, then unlock Buyer Pass when you need the real buying decision.
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Car Lifespan Check helps you compare reliability, recalls, and model-year risk for free. When you are down to a real VIN or listing, Buyer Pass adds the paid buyer report with fair pricing, negotiation notes, and maintenance projections.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Buyer Pass is {BUYER_PASS_OFFER}, no recurring subscription.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 font-medium text-zinc-900 hover:bg-amber-600"
              >
                See Buyer Pass pricing
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Browse by budget
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Explore all cars
              </Link>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900">
            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] bg-zinc-100 text-sm font-semibold dark:bg-zinc-800/80">
              <div className="p-4">What you get</div>
              <div className="p-4">Free</div>
              <div className="p-4 text-amber-700 dark:text-amber-300">Buyer Pass</div>
            </div>
            {comparisonPreview.map((row, index) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1.4fr_0.8fr_0.8fr] text-sm ${
                  index !== comparisonPreview.length - 1 ? 'border-t' : ''
                }`}
              >
                <div className="p-4 font-medium">{row.feature}</div>
                <div className="p-4 text-muted-foreground">{row.free}</div>
                <div className="p-4 text-muted-foreground">{row.buyerPass}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
              <p className="font-semibold">Free comparison checks</p>
              <p className="mt-1 text-muted-foreground">Use the homepage to compare lifespan outlook, recalls, and reliability patterns before you shortlist a car.</p>
            </div>
            <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
              <p className="font-semibold">Buyer-side pricing help</p>
              <p className="mt-1 text-muted-foreground">Buyer Pass gives you fair-price context and negotiation talking points when you have a real listing in front of you.</p>
            </div>
            <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
              <p className="font-semibold">Practical ownership planning</p>
              <p className="mt-1 text-muted-foreground">See likely maintenance costs and longer-term risk before you commit to a used car.</p>
            </div>
          </div>

          <div className="mt-5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Explore:</span>{' '}
            <Link href="/pricing" className="underline hover:no-underline">Pricing</Link>{' · '}
            <Link href="/browse" className="underline hover:no-underline">Browse by Budget</Link>{' · '}
            <Link href="/explore" className="underline hover:no-underline">Explore All Cars</Link>{' · '}
            <Link href="/blog" className="underline hover:no-underline">Reliability Blog</Link>{' · '}
            <Link href="/guide" className="underline hover:no-underline">Buying Guide</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

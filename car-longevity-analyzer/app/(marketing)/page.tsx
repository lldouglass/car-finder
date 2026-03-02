import type { Metadata } from 'next';
import Link from 'next/link';
import HomeAppLoader from '@/components/home-app-loader';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

/**
 * Homepage — renders in the (marketing) layout for full SSR.
 *
 * The SSR hero content is visible to Googlebot as real HTML.
 * The interactive ChatLayout loads client-side only (ssr: false)
 * with its own Providers wrapper.
 */
export default function Home() {
  return (
    <>
      {/* SSR content — Googlebot sees this as real HTML */}
      <div
        id="ssr-hero"
        className="max-w-3xl mx-auto px-4 py-12 text-center"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          How Long Will My Car Last?
        </h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
          Get a free, instant reliability analysis for any vehicle. We check NHTSA recall
          data, complaint records, and owner-reported mileage to estimate how many miles
          your car has left.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-8 text-left">
          <div className="rounded-xl border p-5 bg-white dark:bg-zinc-900">
            <h2 className="font-semibold mb-2">🔍 Lifespan Prediction</h2>
            <p className="text-sm text-muted-foreground">
              See how many miles your car is likely to last based on make, model, and year data
              from thousands of real vehicles.
            </p>
          </div>
          <div className="rounded-xl border p-5 bg-white dark:bg-zinc-900">
            <h2 className="font-semibold mb-2">⚠️ Recall &amp; Safety Check</h2>
            <p className="text-sm text-muted-foreground">
              Instantly check for open recalls, NHTSA complaints, and known safety issues
              for any year, make, and model.
            </p>
          </div>
          <div className="rounded-xl border p-5 bg-white dark:bg-zinc-900">
            <h2 className="font-semibold mb-2">📊 Reliability Score</h2>
            <p className="text-sm text-muted-foreground">
              Get a data-driven reliability rating comparing your car against similar vehicles
              in its class and price range.
            </p>
          </div>
        </div>

        <div className="mt-10 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Popular searches:</strong>{' '}
            <Link href="/blog/honda-civic-lifespan-how-many-miles" className="underline">Honda Civic lifespan</Link>{' · '}
            <Link href="/blog/how-long-does-toyota-tacoma-last" className="underline">Toyota Tacoma reliability</Link>{' · '}
            <Link href="/blog/most-reliable-suvs-2026" className="underline">Most reliable SUVs 2026</Link>{' · '}
            <Link href="/blog/best-family-cars-for-reliability-2026" className="underline">Best family cars 2026</Link>
          </p>
        </div>
      </div>

      {/* Interactive tool — loads client-side only */}
      <HomeAppLoader />
    </>
  );
}

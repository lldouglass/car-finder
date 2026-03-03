import type { Metadata } from "next";
import Link from "next/link";
import { browseCars } from "@/lib/browse-data";
import { BrowseClient } from "./browse-client";

export const metadata: Metadata = {
  title: "Browse Reliable Cars by Budget | Car Lifespan Check",
  description:
    "Find the most reliable used cars at every budget. Browse curated picks under $5K, $10K, $15K, $25K, and $35K — ranked by reliability score with real NHTSA data.",
  alternates: {
    canonical: "/browse",
  },
  openGraph: {
    title: "Browse Reliable Cars by Budget | Car Lifespan Check",
    description:
      "Find the most reliable used cars at every budget. Curated picks ranked by reliability score with real NHTSA data.",
    url: "https://www.carlifespancheck.com/browse",
  },
};

export default function BrowsePage() {
  const topFive = [...browseCars]
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <BrowseClient />

      {/* Crawlable summary content for SEO */}
      <section className="border-t bg-white dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Most Reliable Used Cars by Budget
          </h1>
          <p className="text-muted-foreground mb-4 max-w-3xl">
            Browse reliability rankings built from NHTSA complaint trends, known model-year issues,
            and pricing tiers from under $5K to under $35K.
          </p>

          <h2 className="text-lg font-semibold mb-2">Top reliability picks right now</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
            {topFive.map((car) => (
              <li key={`${car.make}-${car.model}-${car.yearRange}`}>
                {car.make} {car.model} ({car.yearRange}) — {car.reliabilityScore}/10 reliability, avg ${car.avgPrice.toLocaleString()}
              </li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground">
            Looking for deeper comparison?{' '}
            <Link href="/explore" className="underline hover:no-underline">Explore all cars</Link>{' '}
            or read our latest{' '}
            <Link href="/blog" className="underline hover:no-underline">reliability research</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

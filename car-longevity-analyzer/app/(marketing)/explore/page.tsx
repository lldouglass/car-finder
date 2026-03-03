import type { Metadata } from "next";
import Link from "next/link";
import { exploreCars } from "@/lib/explore-data";
import { ExploreClient } from "./explore-client";

export const metadata: Metadata = {
  title: "Explore All Cars — NHTSA Complaint Data & Reliability Scores | Car Lifespan Check",
  description:
    "Search, filter, and compare every car in our database. Real NHTSA complaint counts, reliability scores, and safety ratings for 150+ popular vehicles.",
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    title: "Explore All Cars — NHTSA Complaint Data | Car Lifespan Check",
    description:
      "Search, filter, and compare every car in our database. Real NHTSA complaint counts, reliability scores, and safety ratings.",
    url: "https://www.carlifespancheck.com/explore",
  },
};

export default function ExplorePage() {
  const modelsCovered = new Set(exploreCars.map((c) => `${c.make} ${c.model}`)).size;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <ExploreClient />

      {/* Crawlable summary content for SEO */}
      <section className="border-t bg-white dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Explore Car Reliability Data by Make, Model, and Year
          </h1>
          <p className="text-muted-foreground mb-4 max-w-3xl">
            Compare {exploreCars.length}+ vehicle-year records across {modelsCovered}+ models using
            NHTSA complaint counts, safety ratings, and reliability scores.
          </p>

          <h2 className="text-lg font-semibold mb-2">What you can analyze</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
            <li>Sort by reliability score, complaint volume, or safety rating</li>
            <li>Filter by make, model, and year range</li>
            <li>Compare 2 to 3 vehicles side by side before buying</li>
          </ul>

          <p className="text-sm text-muted-foreground">
            Want quicker recommendations?{' '}
            <Link href="/browse" className="underline hover:no-underline">Browse by budget</Link>{' '}
            or run a custom{' '}
            <Link href="/" className="underline hover:no-underline">vehicle analysis</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
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
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <ExploreClient />
    </main>
  );
}

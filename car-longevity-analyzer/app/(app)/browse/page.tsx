import type { Metadata } from "next";
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
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <BrowseClient />
    </main>
  );
}

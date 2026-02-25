import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Car Reliability Guide | How to Check Any Car's Lifespan",
  description:
    "Learn how to use NHTSA complaint data to check any car's reliability before you buy. Free guide covering what to look for, red flags by brand, and how to avoid costly mistakes.",
  alternates: {
    canonical: "/guide",
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

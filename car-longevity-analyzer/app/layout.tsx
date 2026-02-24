import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";
import { AnalysisProvider } from "@/lib/analysis-context";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.carlifespancheck.com"),
  title: "How Long Will My Car Last? | Free Car Lifespan & Reliability Check",
  description: "Check any car's expected lifespan, reliability score, and known problems. Free instant analysis using NHTSA data for 200+ models. Find out if your car is a keeper or a money pit.",
  keywords: "car lifespan, how long will my car last, car reliability check, vehicle lifespan calculator, car life expectancy, used car analyzer, car reliability scores",
  // NOTE: Do NOT set alternates.canonical here - it gets inherited by ALL child
  // pages and tells Google they're all the homepage. Each page sets its own canonical.
  // Pages without explicit canonical are fine - Google uses the actual URL.
  openGraph: {
    title: "How Long Will My Car Last? | Free Car Lifespan Check",
    description: "Check any car's expected lifespan, reliability score, and known problems. Free instant analysis for 200+ models.",
    url: "https://www.carlifespancheck.com",
    siteName: "Car Lifespan Check",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Long Will My Car Last? | Free Car Lifespan Check",
    description: "Check any car's expected lifespan, reliability score, and known problems. Free instant analysis for 200+ models.",
  },
  other: {
    "impact-site-verification": "576c5c58-aa4c-4042-a769-6944b16c2e39",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={{
        signIn: {
          start: {
            title: "Sign in to Car Lifespan Check",
            subtitle: "Welcome back! Please sign in to continue",
          },
        },
        signUp: {
          start: {
            title: "Create your Car Lifespan Check account",
            subtitle: "Welcome! Please fill in the details to get started",
          },
        },
      }}
    >
      <html lang="en">
        <head>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6461039936764930"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ToastProvider>
            <AnalysisProvider>
              {children}
            </AnalysisProvider>
          </ToastProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
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
  title: "Don't Buy a Lemon - Used Car Analyzer",
  description: "Find out if a used car is overpriced, unreliable, or hiding problems. Get instant reliability scores, price analysis, and red flag detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
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

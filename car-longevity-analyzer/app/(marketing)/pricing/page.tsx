import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, CarFront, Check, Crown, ShieldCheck } from 'lucide-react';
import { BuyerPassCTAButton } from '@/components/billing/buyer-pass-cta-button';
import { SiteFooter } from '@/components/marketing/site-footer';
import {
  BUYER_PASS_OFFER,
  BUYER_PASS_PRICE,
  BUYER_PASS_TERM,
  buyerPassComparison,
  buyerPassFaqs,
} from '@/lib/buyer-pass';

export const metadata: Metadata = {
  title: 'Buyer Pass Pricing | Car Lifespan Check',
  description:
    'See exactly what Buyer Pass includes. $12 one-time for 30 days of VIN reports, fair price ranges, negotiation notes, and maintenance projections.',
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="mb-10 rounded-3xl border bg-gradient-to-br from-white via-amber-50 to-orange-50 p-8 shadow-sm dark:from-zinc-900 dark:via-amber-950/20 dark:to-orange-950/20">
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-zinc-950/70 dark:text-amber-300">
              Buyer Pass pricing
            </div>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Get the full buyer report before you hand over the keys.
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                  Start free, then unlock Buyer Pass when you have a real VIN or listing to evaluate. You get pricing guidance, likely repair costs, negotiation talking points, and other details built for used car buyers.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <BuyerPassCTAButton
                    className="bg-amber-500 text-zinc-900 hover:bg-amber-600"
                    size="lg"
                    signedOutLabel="Create free account to buy"
                    signedInLabel="Buy Buyer Pass now"
                  >
                    <Crown className="size-4" />
                    Buy Buyer Pass now
                  </BuyerPassCTAButton>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    Run a free car check first
                  </Link>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {BUYER_PASS_OFFER}, no recurring subscription.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <Crown className="size-4" />
                  Buyer Pass
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-tight">{BUYER_PASS_PRICE}</span>
                  <span className="pb-1 text-sm text-muted-foreground">one-time</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{BUYER_PASS_TERM} of access, then it ends automatically.</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    'Unlimited VIN reports for active shopping',
                    'Fair price range and deal context',
                    'Negotiation notes you can use at the dealership',
                    'Maintenance cost projection and ownership risks',
                    'Pre-purchase checklist before you buy',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <section className="mb-12">
            <div className="mb-5">
              <h2 className="text-2xl font-bold tracking-tight">Free check vs Buyer Pass</h2>
              <p className="mt-2 text-muted-foreground">
                Use the free tools to compare models. Buy Buyer Pass when you want the deeper report on a specific car.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] bg-zinc-50 text-sm font-semibold dark:bg-zinc-900/70">
                <div className="p-4">What you get</div>
                <div className="p-4">Free</div>
                <div className="p-4 text-amber-700 dark:text-amber-300">Buyer Pass</div>
              </div>
              {buyerPassComparison.map((row, index) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1.4fr_0.8fr_0.8fr] text-sm ${
                    index !== buyerPassComparison.length - 1 ? 'border-t' : ''
                  }`}
                >
                  <div className="p-4 font-medium">{row.feature}</div>
                  <div className="p-4 text-muted-foreground">{row.free}</div>
                  <div className="p-4 text-muted-foreground">{row.buyerPass}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border p-5">
              <CarFront className="size-5 text-blue-600" />
              <h3 className="mt-4 font-semibold">For real car shopping</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This is for buyers narrowing down a real car, not casual browsing. Bring a VIN or listing and get a more practical report.
              </p>
            </div>
            <div className="rounded-2xl border p-5">
              <BadgeCheck className="size-5 text-green-600" />
              <h3 className="mt-4 font-semibold">One payment, no surprise renewal</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Buyer Pass lasts {BUYER_PASS_TERM} and ends on its own. No monthly subscription to remember or cancel.
              </p>
            </div>
            <div className="rounded-2xl border p-5">
              <ShieldCheck className="size-5 text-amber-600" />
              <h3 className="mt-4 font-semibold">Start free first</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You can still run free model checks before paying. Upgrade only when you want the full buyer-side breakdown.
              </p>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border bg-zinc-50 p-6 dark:bg-zinc-900/60">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Ready to evaluate the car you are actually considering?</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Buyer Pass is the fastest way to turn a VIN or listing into a practical pre-purchase report.
                </p>
              </div>
              <BuyerPassCTAButton
                className="bg-amber-500 text-zinc-900 hover:bg-amber-600"
                size="lg"
                signedOutLabel="Create free account to buy"
                signedInLabel="Buy Buyer Pass"
              >
                <Crown className="size-4" />
                Buy Buyer Pass
              </BuyerPassCTAButton>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight">Buyer Pass FAQ</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {buyerPassFaqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border p-5">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}

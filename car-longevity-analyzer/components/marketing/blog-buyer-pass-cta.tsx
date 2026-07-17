import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardCheck, DollarSign, Gauge, ShieldCheck, Wrench } from 'lucide-react';
import type { BlogVehicle } from '@/lib/blog-vehicle';

const buyerPassFeatures = [
  { icon: DollarSign, text: 'Fair price range for the listing' },
  { icon: ShieldCheck, text: 'Negotiation notes before you offer' },
  { icon: Wrench, text: 'Maintenance outlook and ownership risks' },
  { icon: ClipboardCheck, text: 'Pre-purchase checklist for the test drive' },
] as const;

interface BlogCtaProps {
  vehicle?: BlogVehicle | null;
  slug?: string;
}

/**
 * Deep-link into the homepage checker. With a vehicle, make/model arrive as
 * query params and the checker pre-fills them — the reader only picks a year.
 */
function checkerUrl(vehicle: BlogVehicle | null | undefined, slug: string | undefined, medium: string): string {
  const params = new URLSearchParams();
  if (vehicle) {
    params.set('make', vehicle.make);
    params.set('model', vehicle.model);
  }
  params.set('utm_source', 'blog');
  params.set('utm_medium', medium);
  if (slug) params.set('utm_content', slug);
  return `/?${params.toString()}`;
}

export function BlogBuyerPassTopBanner({ vehicle, slug }: BlogCtaProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-amber-500 dark:from-blue-800 dark:via-blue-700 dark:to-amber-600">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
        <p className="text-center text-sm font-semibold text-white sm:text-left sm:text-base">
          {vehicle
            ? `Own or shopping a ${vehicle.make} ${vehicle.model}? See how long YOURS will last — free, 10 seconds.`
            : 'Shopping a specific used car? Run the free check, then unlock the $12 Buyer Pass before you buy.'}
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href={checkerUrl(vehicle, slug, 'top_banner')}
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 whitespace-nowrap"
          >
            {vehicle ? `Check my ${vehicle.model}` : 'Run a free check'}
            <ArrowRight className="ml-1.5 size-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap"
          >
            See Buyer Pass
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Mid-article CTA — shown at the point of highest intent, right when the
 * reader is deep in research about a specific model.
 */
export function BlogInlineCheckCta({ vehicle, slug }: BlogCtaProps) {
  return (
    <aside className="my-10 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm dark:border-blue-900 dark:from-blue-950/40 dark:to-zinc-900 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="hidden rounded-xl bg-blue-600/10 p-3 text-blue-700 dark:text-blue-300 sm:block">
          <Gauge className="size-6" />
        </span>
        <div className="flex-1">
          <p className="text-lg font-bold tracking-tight sm:text-xl">
            {vehicle
              ? `How long will YOUR ${vehicle.make} ${vehicle.model} last?`
              : 'How long will your car last?'}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {vehicle
              ? `Averages only tell you so much — reliability swings hard by model year. Get a free lifespan and reliability score for your exact ${vehicle.model} year. No signup.`
              : 'Get a free lifespan and reliability score for your exact year, make, and model. No signup.'}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href={checkerUrl(vehicle, slug, 'inline_cta')}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {vehicle ? `Check my ${vehicle.model} — free` : 'Check my car — free'}
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
            <span className="text-xs text-muted-foreground sm:ml-2">
              Takes ~10 seconds · 3 free checks
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function BlogBuyerPassBottomCard({ vehicle, slug }: BlogCtaProps) {
  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-amber-50 p-8 shadow-sm dark:border-blue-900/60 dark:from-zinc-900 dark:via-blue-950/25 dark:to-amber-950/20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-amber-500/15 p-3">
          <CheckCircle2 className="size-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {vehicle
            ? `Serious about a ${vehicle.make} ${vehicle.model}? Check it before you buy.`
            : 'Found a car you might buy? Check the VIN first.'}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Start with the free lifespan check, then use Buyer Pass to unlock the details that matter at decision time: fair price range, negotiation notes, maintenance outlook, and a pre-purchase checklist.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {buyerPassFeatures.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 rounded-xl border border-blue-100/80 bg-white/75 p-3 text-sm font-medium dark:border-blue-900/50 dark:bg-zinc-950/60"
          >
            <span className="rounded-lg bg-blue-600/10 p-2 text-blue-700 dark:text-blue-300">
              <Icon className="size-4" />
            </span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={checkerUrl(vehicle, slug, 'bottom_card')}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          {vehicle ? `Check my ${vehicle.model} — free` : 'Run a free check'}
          <ArrowRight className="ml-1.5 size-4" />
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-100 px-7 py-3 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70"
        >
          See Buyer Pass
        </Link>
      </div>
    </div>
  );
}

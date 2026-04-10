'use client';

import { SignUpButton, useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, DollarSign, Target, Wrench, ClipboardCheck } from 'lucide-react';

interface SignUpBannerProps {
  onUpgradeClick?: () => void;
}

const BUYER_PASS_PRICE = process.env.NEXT_PUBLIC_BUYER_PASS_PRICE || '$12';

const premiumFeatures = [
  { icon: DollarSign, text: 'Fair price analysis so you know if the listing is worth chasing' },
  { icon: Target, text: 'Negotiation plan with a target offer and walk-away price' },
  { icon: Wrench, text: 'Maintenance outlook before surprise repairs become your problem' },
  { icon: ClipboardCheck, text: 'Inspection checklist built for this vehicle family' },
];

export function SignUpBanner({ onUpgradeClick }: SignUpBannerProps) {
  const { isSignedIn } = useUser();

  return (
    <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/80 text-zinc-50 dark:border-amber-900/60">
      <CardContent className="p-6 md:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500 text-zinc-900 hover:bg-amber-500">
                Buyer Pass {BUYER_PASS_PRICE}
              </Badge>
              <Badge variant="outline" className="border-zinc-700 bg-zinc-900/60 text-zinc-200">
                One-time payment
              </Badge>
              <span className="text-xs text-zinc-400">30 days access, no recurring subscription</span>
            </div>

            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3">
                <Crown className="size-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Liked the free report? Unlock the buying tools before you make an offer.</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  Free search gives you lifespan, safety, recalls, and common issues. Buyer Pass adds the paid tools that help you price the car, negotiate, inspect it, and estimate what ownership may really cost.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {premiumFeatures.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="rounded-lg bg-amber-500/10 p-2">
                    <Icon className="size-4 text-amber-400" />
                  </div>
                  <p className="text-sm text-zinc-200">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm font-medium text-amber-300">Before you buy</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-bold">{BUYER_PASS_PRICE}</span>
              <span className="pb-1 text-sm text-zinc-400">one-time</span>
            </div>
            <p className="mt-1 text-sm text-zinc-300">30 days of Buyer Pass access. No subscription to cancel.</p>

            <div className="mt-5">
              {isSignedIn ? (
                <Button
                  onClick={onUpgradeClick}
                  disabled={!onUpgradeClick}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900"
                >
                  <Crown className="size-4" />
                  Unlock Buyer Pass
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900">
                    <Crown className="size-4" />
                    Unlock Buyer Pass
                  </Button>
                </SignUpButton>
              )}
            </div>

            <p className="mt-3 text-xs text-zinc-400">
              {isSignedIn
                ? 'Secure one-time checkout via Stripe.'
                : 'Create your free account first, then complete the one-time Buyer Pass checkout.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

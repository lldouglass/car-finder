'use client';

import { SignUpButton, useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  DollarSign,
  Wrench,
  ClipboardCheck,
  Lock,
  Crown,
  ArrowRight,
  Target,
} from 'lucide-react';

interface InlineVinUpsellProps {
  onSwitchToVin?: () => void;
  onUpgradeClick?: () => void;
  vehicleName?: string;
}

const BUYER_PASS_PRICE = process.env.NEXT_PUBLIC_BUYER_PASS_PRICE || '$12';

const vinFeatures = [
  { icon: DollarSign, label: 'Fair price analysis', description: 'See likely market range before you overpay' },
  { icon: Target, label: 'Negotiation plan', description: 'Get a target offer and walk-away number' },
  { icon: Wrench, label: 'Maintenance outlook', description: 'Preview near-term and 5-year ownership costs' },
  { icon: ClipboardCheck, label: 'Inspection checklist', description: 'Bring model-specific trouble spots to the meetup' },
];

export function InlineVinUpsell({ onSwitchToVin, onUpgradeClick, vehicleName }: InlineVinUpsellProps) {
  const { isSignedIn } = useUser();

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:border-amber-900/60 dark:from-amber-950/40 dark:via-zinc-950 dark:to-orange-950/20">
      <CardContent className="pt-6 pb-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            Free report unlocked
          </Badge>
          <Badge className="bg-amber-500 text-zinc-900 hover:bg-amber-500">
            Buyer Pass {BUYER_PASS_PRICE}
          </Badge>
          <span className="text-muted-foreground">One-time payment, 30 days, no subscription</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 rounded-full bg-amber-500/15 p-2.5 w-fit">
              <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold leading-tight">
              Turn this free reliability check into a real buying plan
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {vehicleName
                ? `You already know the basics for the ${vehicleName}. Buyer Pass adds the parts that actually help you buy smarter: fair pricing, negotiation guidance, maintenance outlook, and a mechanic-ready inspection checklist.`
                : 'Your free report covers lifespan, safety, known issues, and recalls. Buyer Pass adds the paid buyer tools that help you price the car, negotiate confidently, and spot expensive problems before you commit.'}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[260px]">
            {isSignedIn ? (
              <Button
                onClick={onUpgradeClick}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900"
                disabled={!onUpgradeClick}
              >
                <Crown className="size-4" />
                Unlock Buyer Pass, {BUYER_PASS_PRICE}
              </Button>
            ) : (
              <SignUpButton mode="modal">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900">
                  <Crown className="size-4" />
                  Unlock Buyer Pass, {BUYER_PASS_PRICE}
                </Button>
              </SignUpButton>
            )}

            {onSwitchToVin && (
              <Button onClick={onSwitchToVin} variant="outline" className="w-full">
                Have the VIN? Use it now
                <ArrowRight className="size-4" />
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Best once you have the VIN from the listing, dashboard, or door jamb.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vinFeatures.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-background/80 p-3 dark:border-amber-900/40"
            >
              <div className="rounded-md bg-amber-500/10 p-1.5 shrink-0">
                <Icon className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-tight">{label}</p>
                  <Lock className="size-3 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Free stays useful: lifespan, safety ratings, known issues, red flags, recalls, and seller questions. Buyer Pass unlocks the decision-making layer.
        </p>
      </CardContent>
    </Card>
  );
}

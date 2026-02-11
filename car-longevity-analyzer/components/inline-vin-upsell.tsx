'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Wrench,
  Shield,
  ClipboardCheck,
  BarChart3,
  BadgeCheck,
} from 'lucide-react';

interface InlineVinUpsellProps {
  onSwitchToVin?: () => void;
  vehicleName?: string;
}

const vinFeatures = [
  { icon: TrendingUp, label: 'Lifespan Projections', description: 'Remaining miles & years estimate' },
  { icon: DollarSign, label: 'Fair Price Analysis', description: 'Market comparison & deal quality' },
  { icon: Shield, label: 'Negotiation Strategy', description: 'Suggested offer & walk-away price' },
  { icon: Wrench, label: 'Maintenance Costs', description: 'Annual & 5-year cost projection' },
  { icon: BarChart3, label: 'Survival Probability', description: 'Mileage milestone predictions' },
  { icon: ClipboardCheck, label: 'Inspection Checklist', description: 'Model-specific pre-purchase checks' },
  { icon: BadgeCheck, label: 'Warranty Value', description: 'Coverage quality & financial value' },
];

export function InlineVinUpsell({ onSwitchToVin, vehicleName }: InlineVinUpsellProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-6 pb-6">
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 rounded-full bg-primary/10 p-2.5 w-fit">
            <Sparkles className="size-5 text-primary" />
          </div>
          <h3 className="font-semibold text-base mb-1">
            Get the Full Report
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {vehicleName
              ? `You've seen the reliability and safety data for the ${vehicleName}. Enter a VIN to unlock the complete analysis:`
              : 'Your free search covered reliability and safety. Enter a VIN to unlock the complete analysis:'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {vinFeatures.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/60 border border-primary/10"
            >
              <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                <Icon className="size-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {onSwitchToVin && (
          <div className="text-center">
            <Button
              onClick={onSwitchToVin}
              className="gap-2"
            >
              <Sparkles className="size-4" />
              Get Full VIN Report
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You&apos;ll find the VIN on the driver&apos;s side dashboard or door jamb
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

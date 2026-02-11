'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, DollarSign, Wrench, Shield, ClipboardCheck } from 'lucide-react';

interface UpsellBannerProps {
  onSwitchToVin?: () => void;
}

const features = [
  { icon: TrendingUp, label: 'Lifespan projections' },
  { icon: DollarSign, label: 'Fair price analysis' },
  { icon: Wrench, label: 'Maintenance costs' },
  { icon: Shield, label: 'Negotiation strategy' },
  { icon: ClipboardCheck, label: 'Inspection checklist' },
];

export function UpsellBanner({ onSwitchToVin }: UpsellBannerProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Want the full picture?
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Enter your VIN for a detailed report with pricing, lifespan projections, and a pre-purchase checklist.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
              {features.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="size-3" />
                  {label}
                </span>
              ))}
            </div>
            {onSwitchToVin && (
              <Button
                size="sm"
                onClick={onSwitchToVin}
                className="gap-2"
              >
                <Sparkles className="size-3" />
                Get Full VIN Report
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

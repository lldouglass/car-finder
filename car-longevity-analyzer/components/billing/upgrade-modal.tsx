'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Crown, Zap, Shield, Clock, DollarSign, Target, FileText, BarChart3, TrendingUp } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageInfo?: {
    used: number;
    limit: number;
  };
}

const PRICE = process.env.NEXT_PUBLIC_PREMIUM_PRICE || '$5.99';

const features = [
  { icon: Zap, text: 'Unlimited VIN analyses' },
  { icon: DollarSign, text: 'Fair market price estimates' },
  { icon: Target, text: 'Negotiation talking points' },
  { icon: Clock, text: '10-year maintenance cost projections' },
  { icon: FileText, text: 'Pre-purchase inspection checklist' },
  { icon: BarChart3, text: 'Survival probability curves' },
];

export function UpgradeModal({ isOpen, onClose, usageInfo }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center bg-gradient-to-b from-amber-500/10 to-transparent">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-amber-500/20 mb-4">
            <Crown className="size-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">
            Get 30 Days Unlimited
          </h2>
          <p className="text-zinc-400 text-sm">
            Analyze every car on your list before you buy
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Price */}
          <div className="text-center mb-6">
            <span className="text-4xl font-bold text-zinc-100">{PRICE}</span>
            <span className="text-zinc-400"> for 30 days</span>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-6">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="flex-shrink-0 size-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Check className="size-4 text-green-400" />
                </div>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold text-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              'Start Analyzing'
            )}
          </Button>

          <p className="text-center text-xs text-zinc-500 mt-4">
            One-time payment. Secure checkout via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}

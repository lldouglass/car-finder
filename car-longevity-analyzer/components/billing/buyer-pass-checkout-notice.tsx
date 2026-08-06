'use client';

import { useEffect, useState } from 'react';
import {
  SignInButton,
  SignUpButton,
  useUser,
} from '@clerk/nextjs';
import { CheckCircle2, Clock3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CheckoutState = 'hidden' | 'success' | 'cancelled';
type ActivationState = 'idle' | 'checking' | 'active' | 'pending';

export function BuyerPassCheckoutNotice() {
  const { isSignedIn } = useUser();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>(() => {
    if (typeof window === 'undefined') return 'hidden';
    const result = new URLSearchParams(window.location.search).get('buyerPass');
    return result === 'success' || result === 'cancelled' ? result : 'hidden';
  });
  const [activationState, setActivationState] = useState<ActivationState>('idle');

  useEffect(() => {
    if (checkoutState !== 'success' || !isSignedIn) return;

    let cancelled = false;

    async function checkActivation() {
      setActivationState('checking');

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const response = await fetch('/api/user/usage', { cache: 'no-store' });
          const data = await response.json();

          if (data.success && data.usage?.isBuyerPassActive) {
            if (!cancelled) setActivationState('active');
            return;
          }
        } catch (error) {
          console.error('Buyer Pass activation check failed', error);
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }

      if (!cancelled) setActivationState('pending');
    }

    void checkActivation();
    return () => {
      cancelled = true;
    };
  }, [checkoutState, isSignedIn]);

  if (checkoutState === 'hidden') return null;

  if (checkoutState === 'cancelled') {
    return (
      <div className="fixed right-4 top-4 z-[60] max-w-sm rounded-xl border bg-background p-4 shadow-xl">
        <button
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          onClick={() => setCheckoutState('hidden')}
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
        <p className="pr-6 font-semibold">Checkout cancelled</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You were not charged. You can restart checkout whenever you are ready.
        </p>
      </div>
    );
  }

  return (
    <div
      className="fixed right-4 top-4 z-[60] max-w-md rounded-2xl border border-emerald-200 bg-background p-5 shadow-2xl dark:border-emerald-900"
      role="status"
    >
      <button
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        onClick={() => setCheckoutState('hidden')}
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-5">
        {activationState === 'checking' ? (
          <Clock3 className="mt-0.5 size-6 shrink-0 text-amber-500" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
        )}
        <div>
          <p className="font-semibold">
            {activationState === 'active'
              ? 'Buyer Pass is active'
              : 'Payment complete'}
          </p>

          {!isSignedIn && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Create an account or sign in with the same email you used at
                checkout to use your 30-day pass.
              </p>
              <div className="mt-4 flex gap-2">
                <SignUpButton mode="modal">
                  <Button size="sm">Create account</Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button size="sm" variant="outline">Sign in</Button>
                </SignInButton>
              </div>
            </>
          )}

          {isSignedIn && activationState === 'checking' && (
            <p className="mt-1 text-sm text-muted-foreground">
              Activating your pass from the completed checkout…
            </p>
          )}

          {isSignedIn && activationState === 'active' && (
            <p className="mt-1 text-sm text-muted-foreground">
              Your unlimited Buyer Pass reports are available for the next 30 days.
            </p>
          )}

          {isSignedIn && activationState === 'pending' && (
            <p className="mt-1 text-sm text-muted-foreground">
              Stripe is still confirming your purchase. Refresh in a moment. If
              you used a different checkout email, sign in with that email.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

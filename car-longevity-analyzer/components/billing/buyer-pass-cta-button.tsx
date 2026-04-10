'use client';

import { useState, type ComponentProps } from 'react';
import { SignUpButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BuyerPassCTAButtonProps extends ComponentProps<typeof Button> {
  signedOutLabel?: string;
  signedInLabel?: string;
  loadingLabel?: string;
}

export function BuyerPassCTAButton({
  children,
  className,
  signedOutLabel,
  signedInLabel,
  loadingLabel = 'Redirecting…',
  ...buttonProps
}: BuyerPassCTAButtonProps) {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);

  const { disabled, ...restButtonProps } = buttonProps;

  const label = children ?? (isSignedIn ? signedInLabel : signedOutLabel) ?? 'Get Buyer Pass';

  async function handleCheckout() {
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();

      if (data.success && data.url) {
        window.location.assign(data.url);
        return;
      }

      window.alert(data.error || 'Failed to start checkout. Please try again.');
    } catch (error) {
      console.error('Buyer Pass checkout failed', error);
      window.alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isSignedIn) {
    return (
      <SignUpButton mode="modal">
        <Button className={cn(className)} disabled={disabled} {...restButtonProps}>
          {label}
        </Button>
      </SignUpButton>
    );
  }

  return (
    <Button
      className={cn(className)}
      disabled={loading || disabled}
      onClick={handleCheckout}
      {...restButtonProps}
    >
      {loading ? loadingLabel : label}
    </Button>
  );
}

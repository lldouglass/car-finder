'use client';

import { useUser, SignUpButton } from '@clerk/nextjs';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignUpGateProps {
  children: React.ReactNode;
  previewHeight?: number;
}

export function SignUpGate({ children, previewHeight = 400 }: SignUpGateProps) {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred preview of the actual content */}
      <div
        className="overflow-hidden pointer-events-none select-none"
        style={{ maxHeight: previewHeight }}
        aria-hidden="true"
      >
        <div className="blur-[6px]">
          {children}
        </div>
      </div>

      {/* Gradient fade overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95"
      />

      {/* CTA card */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-6 max-w-md text-center">
          <div className="mx-auto mb-3 rounded-full bg-primary/10 p-3 w-fit">
            <Lock className="size-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">See the Full Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a free account to unlock detailed pricing, negotiation strategies, maintenance projections, and more.
          </p>
          <SignUpButton mode="modal">
            <Button className="w-full mb-2">
              Create Free Account
            </Button>
          </SignUpButton>
          <p className="text-xs text-muted-foreground">
            No credit card required. 3 free VIN reports per month.
          </p>
        </div>
      </div>
    </div>
  );
}

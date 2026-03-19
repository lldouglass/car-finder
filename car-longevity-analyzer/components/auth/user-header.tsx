'use client';

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
  isBuyerPassActive?: boolean;
  buyerPassExpiresAt?: string | null;
}

function formatBuyerPassExpiry(dateString?: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function UserHeader({ onUpgradeClick }: { onUpgradeClick?: () => void }) {
  const { isSignedIn } = useUser();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchUsage();
    }
  }, [isSignedIn]);

  async function fetchUsage() {
    try {
      const res = await fetch('/api/user/usage');
      const data = await res.json();
      if (data.success) {
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  }

  const expiryLabel = formatBuyerPassExpiry(usage?.buyerPassExpiresAt);

  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-700 hover:bg-zinc-800">
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end text-right">
            {usage?.isPremium ? (
              <>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-2 py-0.5">
                  <Crown className="size-3 mr-1" />
                  Buyer Pass
                </Badge>
                {expiryLabel && (
                  <span className="mt-1 text-[11px] text-zinc-500">
                    Active until {expiryLabel}
                  </span>
                )}
              </>
            ) : (
              <button
                onClick={onUpgradeClick}
                className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
              >
                {usage ? `${usage.remaining}/${usage.limit} free` : 'Free tier'}
              </button>
            )}
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: 'size-8',
                userButtonPopoverCard: 'bg-zinc-900 border-zinc-700',
                userButtonPopoverActionButton: 'text-zinc-300 hover:bg-zinc-800',
                userButtonPopoverActionButtonText: 'text-zinc-300',
                userButtonPopoverFooter: 'hidden',
              },
            }}
          >
            <UserButton.MenuItems>
              {!usage?.isPremium && (
                <UserButton.Action
                  label="Get Buyer Pass"
                  labelIcon={<Crown className="size-4 text-amber-400" />}
                  onClick={() => onUpgradeClick?.()}
                />
              )}
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </SignedIn>
    </div>
  );
}

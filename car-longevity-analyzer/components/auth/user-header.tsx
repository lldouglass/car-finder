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
          {/* Usage/Plan indicator */}
          <div className="flex flex-col items-end text-right">
            {usage?.isPremium ? (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-2 py-0.5">
                <Crown className="size-3 mr-1" />
                Premium
              </Badge>
            ) : (
              <button
                onClick={onUpgradeClick}
                className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
              >
                {usage ? `${usage.remaining}/${usage.limit} free` : 'Free tier'}
              </button>
            )}
          </div>

          {/* Clerk UserButton with custom menu items */}
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
                  label="Upgrade to Premium"
                  labelIcon={<Crown className="size-4 text-amber-400" />}
                  onClick={() => onUpgradeClick?.()}
                />
              )}
              {usage?.isPremium && (
                <UserButton.Action
                  label="Manage Subscription"
                  labelIcon={<Crown className="size-4 text-amber-400" />}
                  onClick={async () => {
                    const res = await fetch('/api/billing/portal', { method: 'POST' });
                    const data = await res.json();
                    if (data.success && data.url) {
                      window.location.href = data.url;
                    }
                  }}
                />
              )}
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </SignedIn>
    </div>
  );
}

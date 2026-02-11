'use client';

import { useUser, SignUpButton } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';

export function SignUpBanner() {
  const { isSignedIn } = useUser();

  if (isSignedIn) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Bookmark className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Save This Report</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Create a free account to save analyses, build your vehicle history, and access full VIN reports.
            </p>
            <SignUpButton mode="modal">
              <Button size="sm" variant="outline" className="gap-2">
                <Bookmark className="size-3" />
                Create Free Account
              </Button>
            </SignUpButton>
            <p className="text-xs text-muted-foreground mt-2">
              No credit card required.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

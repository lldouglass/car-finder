'use client';

import { Car, Loader2 } from 'lucide-react';

export function LoadingMessage() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm p-4">
      <div className="flex items-start gap-4">
        {/* Vehicle icon */}
        <div className="flex-shrink-0 rounded-full bg-primary/10 p-3">
          <Car className="size-6 text-primary" />
        </div>

        {/* Loading content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Analyzing vehicle...</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Checking NHTSA data, safety ratings, recalls, and known issues...
          </p>

          {/* Animated skeleton */}
          <div className="mt-4 space-y-3">
            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

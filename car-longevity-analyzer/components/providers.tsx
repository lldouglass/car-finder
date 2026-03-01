'use client';

import { Suspense, type ReactNode } from 'react';
import { AnalysisProvider } from '@/lib/analysis-context';
import { ToastProvider } from '@/components/ui/toast';

/**
 * Client-side providers wrapper.
 *
 * Wrapped in Suspense to prevent BAILOUT_TO_CLIENT_SIDE_RENDERING
 * which was killing SSR for all pages (blog posts, guide, etc.).
 * Without Suspense, Next.js bails out of SSR for the entire page
 * tree when client components with useEffect/useState wrap children.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ToastProvider>
        <AnalysisProvider>
          {children}
        </AnalysisProvider>
      </ToastProvider>
    </Suspense>
  );
}

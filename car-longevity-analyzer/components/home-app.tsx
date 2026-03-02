'use client';

import { AnalysisProvider } from '@/lib/analysis-context';
import { ToastProvider } from '@/components/ui/toast';
import { ChatLayout } from '@/components/chat/chat-layout';
import { ErrorBoundary } from '@/components/error-boundary';

/**
 * Client-only interactive homepage component.
 * Wraps ChatLayout with necessary providers so it works
 * outside the (app) route group.
 */
export default function HomeApp() {
  return (
    <AnalysisProvider>
      <ToastProvider>
        <ErrorBoundary>
          <ChatLayout />
        </ErrorBoundary>
      </ToastProvider>
    </AnalysisProvider>
  );
}

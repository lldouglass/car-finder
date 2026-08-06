'use client';

import { useEffect, useRef } from 'react';
import { AnalysisProvider, useAnalysis } from '@/lib/analysis-context';
import { ToastProvider } from '@/components/ui/toast';
import { ChatLayout } from '@/components/chat/chat-layout';
import { ErrorBoundary } from '@/components/error-boundary';
import { BuyerPassCheckoutNotice } from '@/components/billing/buyer-pass-checkout-notice';

/**
 * Runs a free check automatically when the page is opened via a full deep link
 * (?year=2018&make=Subaru&model=Outback) — e.g. from year-specific content or
 * shared links. Links without a year are handled by the search form's prefill.
 * A sessionStorage guard keeps refreshes from burning the visitor's free quota.
 */
function DeepLinkAutoRun() {
  const { submitAnalysis } = useAnalysis();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const year = Number.parseInt(params.get('year') ?? '', 10);
    const make = params.get('make');
    const model = params.get('model');
    if (!year || !make || !model) return;

    const guardKey = `clc-autorun-${year}-${make}-${model}`;
    if (sessionStorage.getItem(guardKey)) return;
    sessionStorage.setItem(guardKey, '1');
    ranRef.current = true;
    void submitAnalysis('vehicle', JSON.stringify({ year, make, model }));
  }, [submitAnalysis]);

  return null;
}

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
          <DeepLinkAutoRun />
          <BuyerPassCheckoutNotice />
          <ChatLayout />
        </ErrorBoundary>
      </ToastProvider>
    </AnalysisProvider>
  );
}

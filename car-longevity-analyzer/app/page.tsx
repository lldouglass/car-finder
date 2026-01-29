'use client';

import { ChatLayout } from '@/components/chat/chat-layout';
import { ErrorBoundary } from '@/components/error-boundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <ChatLayout />
    </ErrorBoundary>
  );
}

'use client';

import { ChatLayout } from '@/components/chat/chat-layout';
import { ErrorBoundary } from '@/components/error-boundary';

export default function HomeClient() {
  return (
    <ErrorBoundary>
      <ChatLayout />
    </ErrorBoundary>
  );
}

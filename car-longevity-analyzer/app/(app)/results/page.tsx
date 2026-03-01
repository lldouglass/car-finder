'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to home page - results are now shown inline in the chat UI
export default function ResultsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}

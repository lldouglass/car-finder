'use client';

import dynamic from 'next/dynamic';

const HomeApp = dynamic(() => import('@/components/home-app'), { ssr: false });

/**
 * Client-only loader for the interactive homepage tool.
 * Uses next/dynamic with ssr:false — must be in a Client Component.
 */
export default function HomeAppLoader() {
  return <HomeApp />;
}

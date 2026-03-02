import type { Metadata } from 'next';
import HomeAppLoader from '@/components/home-app-loader';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

/**
 * Homepage — keep this route lightweight and render the interactive app directly.
 */
export default function Home() {
  return <HomeAppLoader />;
}

import type { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <HomeClient />;
}

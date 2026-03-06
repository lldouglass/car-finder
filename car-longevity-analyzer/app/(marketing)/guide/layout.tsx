import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Car Reliability Guide | How to Check Any Car\'s Lifespan',
  description:
    'Learn how to use complaint data, service history, and inspection checks to evaluate any used car before you buy.',
  alternates: {
    canonical: '/guide',
  },
  openGraph: {
    title: 'Car Reliability Guide | How to Check Any Car\'s Lifespan',
    description:
      'Learn how to use complaint data, service history, and inspection checks to evaluate any used car before you buy.',
    url: 'https://www.carlifespancheck.com/guide',
    siteName: 'Car Lifespan Check',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Car Lifespan Check - Used Car Buying Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Reliability Guide | How to Check Any Car\'s Lifespan',
    description:
      'Learn how to use complaint data, service history, and inspection checks to evaluate any used car before you buy.',
    images: ['/og-image.png'],
  },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import { Providers } from '@/components/providers';

/**
 * App layout — wraps interactive pages with client providers.
 *
 * Pages that need auth (Clerk) and analysis context go here:
 * homepage, browse, explore, results, report, sign-in, sign-up.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}

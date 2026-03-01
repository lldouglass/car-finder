/**
 * Marketing layout — pure server component.
 *
 * Blog and guide pages don't need auth (Clerk) or analysis context.
 * Keeping them free of client providers enables full SSR, which is
 * critical for SEO (Google gets real HTML, not RSC payload).
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

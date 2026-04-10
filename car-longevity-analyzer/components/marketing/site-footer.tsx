import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t bg-white dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} Clayrnt LLC</span>
        <Link href="/pricing" className="underline hover:no-underline">Pricing</Link>
        <Link href="/about" className="underline hover:no-underline">About</Link>
        <Link href="/privacy" className="underline hover:no-underline">Privacy Policy</Link>
        <Link href="/terms" className="underline hover:no-underline">Terms of Service</Link>
        <Link href="/contact" className="underline hover:no-underline">Contact</Link>
      </div>
    </footer>
  );
}

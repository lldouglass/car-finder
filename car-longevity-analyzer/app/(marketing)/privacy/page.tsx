import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Car Lifespan Check',
  description: 'Privacy policy for Car Lifespan Check. Learn how we collect, use, and protect your data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 7, 2026</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
            <p>
              When you use Car Lifespan Check, we may collect the following information:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> If you create an account, we collect your name and email address through our authentication provider (Clerk).</li>
              <li><strong>Vehicle searches:</strong> The year, make, and model of vehicles you search for, used to generate reliability reports.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and general interaction patterns collected through analytics tools.</li>
              <li><strong>Device information:</strong> Browser type, operating system, and screen size for improving your experience.</li>
              <li><strong>Payment information:</strong> If you purchase Buyer Pass, payment details are processed securely by Stripe. We do not store your credit card numbers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide vehicle reliability reports and lifespan estimates.</li>
              <li>To manage your account and process Buyer Pass payments.</li>
              <li>To improve our service based on usage patterns.</li>
              <li>To send important updates about your account (we do not send marketing emails without consent).</li>
              <li>To display relevant advertisements through Google AdSense.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keep you signed in to your account.</li>
              <li>Understand how visitors use our site (via PostHog analytics).</li>
              <li>Serve relevant ads through Google AdSense. Google may use cookies to serve ads based on your prior visits to this or other websites. You can opt out of personalized advertising at <a href="https://www.google.com/settings/ads" className="underline" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>.</li>
            </ul>
            <p>
              Third-party vendors, including Google, use cookies to serve ads based on your prior visits. You can opt out of third-party vendor cookies at the <a href="https://optout.networkadvertising.org/" className="underline" target="_blank" rel="noopener noreferrer">Network Advertising Initiative opt-out page</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Data Sources</h2>
            <p>
              Vehicle reliability data is sourced from publicly available government databases including NHTSA (National Highway Traffic Safety Administration) complaint records, recall data, and manufacturer information. We do not collect personal data from these sources.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Service providers:</strong> Clerk (authentication), Stripe (payments), Vercel (hosting), Neon (database), PostHog (analytics).</li>
              <li><strong>Advertising partners:</strong> Google AdSense for serving relevant ads.</li>
              <li><strong>Legal requirements:</strong> If required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Data Security</h2>
            <p>
              We use industry-standard security measures to protect your data, including encrypted connections (HTTPS), secure authentication, and encrypted payment processing through Stripe. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt out of personalized advertising.</li>
              <li>Delete your account at any time.</li>
            </ul>
            <p>
              To exercise these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Car Lifespan Check is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be posted on this page with an updated date. Continued use of the site after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Contact</h2>
            <p>
              If you have questions about this privacy policy or your data, contact us at: <a href="mailto:logan42.ld@gmail.com" className="underline">logan42.ld@gmail.com</a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t text-sm text-muted-foreground">
          <Link href="/" className="underline hover:no-underline">Back to Home</Link>
          {' · '}
          <Link href="/terms" className="underline hover:no-underline">Terms of Service</Link>
          {' · '}
          <Link href="/about" className="underline hover:no-underline">About</Link>
          {' · '}
          <Link href="/contact" className="underline hover:no-underline">Contact</Link>
        </div>
      </div>
    </div>
  );
}

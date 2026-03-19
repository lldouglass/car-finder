import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Car Lifespan Check',
  description: 'Terms of service for Car Lifespan Check. Read our terms for using the vehicle reliability analysis platform.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 7, 2026</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Car Lifespan Check (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Description of Service</h2>
            <p>
              Car Lifespan Check provides vehicle reliability analysis, lifespan estimates, and recall information based on publicly available data from the National Highway Traffic Safety Administration (NHTSA) and other sources. The Service is available in a free tier plus an optional paid Buyer Pass.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. Vehicle reliability reports, lifespan estimates, and scores are based on historical data and statistical analysis. They are for informational purposes only and should not be the sole basis for purchasing decisions.
            </p>
            <p>
              We do not guarantee the accuracy, completeness, or timeliness of any information provided. Vehicle conditions vary based on maintenance history, driving habits, climate, and other factors that our data cannot fully capture.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. User Accounts</h2>
            <p>
              Some features require creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information when creating an account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Buyer Pass</h2>
            <p>
              Buyer Pass is a one-time purchase processed through Stripe. It provides 30 days of access to paid features from the purchase date. Buyer Pass does not auto-renew. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Scrape, crawl, or collect data from the Service in bulk without permission.</li>
              <li>Attempt to gain unauthorized access to any part of the Service.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
              <li>Resell or redistribute reports without authorization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including its design, features, and original content, is owned by Clayrnt LLC. NHTSA data used in reports is public domain. You may share individual reports for personal use but may not reproduce the Service or its content for commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Clayrnt LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Contact</h2>
            <p>
              For questions about these terms, contact us at: <a href="mailto:logan42.ld@gmail.com" className="underline">logan42.ld@gmail.com</a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t text-sm text-muted-foreground">
          <Link href="/" className="underline hover:no-underline">Back to Home</Link>
          {' · '}
          <Link href="/privacy" className="underline hover:no-underline">Privacy Policy</Link>
          {' · '}
          <Link href="/about" className="underline hover:no-underline">About</Link>
          {' · '}
          <Link href="/contact" className="underline hover:no-underline">Contact</Link>
        </div>
      </div>
    </div>
  );
}

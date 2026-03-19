import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | Car Lifespan Check',
  description: 'Get in touch with the Car Lifespan Check team. Questions, feedback, or support requests welcome.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Contact Us</h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-[15px] leading-relaxed">
          <p>
            Have a question, found a bug, or just want to say hi? We would love to hear from you.
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">Email</h2>
            <p>
              The fastest way to reach us: <a href="mailto:logan42.ld@gmail.com" className="underline font-medium">logan42.ld@gmail.com</a>
            </p>
            <p>
              We typically respond within 24-48 hours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">Common Questions</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Is Buyer Pass a subscription?</p>
                <p className="text-muted-foreground">
                  No. Buyer Pass is a one-time payment that gives you 30 days of unlimited access. There is no recurring billing to cancel.
                </p>
              </div>
              <div>
                <p className="font-medium">Where does your data come from?</p>
                <p className="text-muted-foreground">
                  All vehicle data comes from NHTSA (National Highway Traffic Safety Administration), the federal agency that tracks safety complaints, recalls, and vehicle information. Learn more on our <Link href="/about" className="underline">About page</Link>.
                </p>
              </div>
              <div>
                <p className="font-medium">Can I request a specific car model to be added?</p>
                <p className="text-muted-foreground">
                  We cover all makes and models in the NHTSA database, which includes most vehicles sold in the United States. If a vehicle is not showing results, email us and we will look into it.
                </p>
              </div>
              <div>
                <p className="font-medium">I found incorrect data in a report. What should I do?</p>
                <p className="text-muted-foreground">
                  Please email us with the vehicle details and what looks wrong. We take data accuracy seriously and will investigate.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">Business Inquiries</h2>
            <p>
              For partnership, advertising, or business inquiries, reach out to the same email address above. Please include &quot;Business&quot; in the subject line.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">Location</h2>
            <p>
              Clayrnt LLC<br />
              Denver, Colorado
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t text-sm text-muted-foreground">
          <Link href="/" className="underline hover:no-underline">Back to Home</Link>
          {' · '}
          <Link href="/about" className="underline hover:no-underline">About</Link>
          {' · '}
          <Link href="/privacy" className="underline hover:no-underline">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="underline hover:no-underline">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

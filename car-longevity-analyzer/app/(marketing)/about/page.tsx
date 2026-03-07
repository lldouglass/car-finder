import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Car Lifespan Check | Free Vehicle Reliability Analysis',
  description: 'Learn about Car Lifespan Check, the free vehicle reliability tool that uses NHTSA data to help you find cars that last. Built by real car buyers, for car buyers.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-6">About Car Lifespan Check</h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">What We Do</h2>
            <p>
              Car Lifespan Check is a free vehicle reliability tool that helps you figure out how long a car will actually last before you buy it. We pull data from NHTSA (the government agency that tracks safety complaints and recalls), combine it with model-year reliability patterns, and give you a clear picture of what you are getting into.
            </p>
            <p>
              Search any vehicle by year, make, and model. You get a reliability score, common problems, open recalls, estimated lifespan, and suggestions for more reliable alternatives in your budget.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">Why We Built This</h2>
            <p>
              Buying a used car is stressful. You are spending thousands of dollars and most of the information out there is either behind paywalls, biased by advertising, or just too vague to be useful. We wanted something simple: search a car, see the data, make a better decision.
            </p>
            <p>
              The free tier gives you everything you need for a basic check. Premium unlocks deeper analysis, full complaint breakdowns, and unlimited searches for people who are seriously shopping.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">Our Data</h2>
            <p>
              All vehicle data comes from publicly available government sources:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>NHTSA Complaints Database:</strong> Real complaints filed by vehicle owners about problems they experienced.</li>
              <li><strong>NHTSA Recall Data:</strong> Official safety recalls issued by manufacturers.</li>
              <li><strong>Vehicle Identification:</strong> Make, model, and year data from NHTSA&apos;s vehicle database.</li>
            </ul>
            <p>
              We do not make up reliability scores. Everything is derived from actual reported data. Our analysis identifies patterns in complaint frequency, severity, and component failures across model years.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">Who We Are</h2>
            <p>
              Car Lifespan Check is built and operated by Clayrnt LLC, based in Denver, Colorado. We are a small team focused on building useful data tools. We also run <a href="https://moatifi.com" className="underline" target="_blank" rel="noopener noreferrer">Moatifi</a>, a stock analysis platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">Important Disclaimer</h2>
            <p>
              Our reports are based on historical data and statistical patterns. They are helpful for spotting trends, but they cannot predict the future of any individual car. A vehicle&apos;s actual lifespan depends on maintenance, driving conditions, previous owners, and luck. Always get a pre-purchase inspection from a qualified mechanic before buying any used car.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t text-sm text-muted-foreground">
          <Link href="/" className="underline hover:no-underline">Back to Home</Link>
          {' · '}
          <Link href="/blog" className="underline hover:no-underline">Reliability Blog</Link>
          {' · '}
          <Link href="/privacy" className="underline hover:no-underline">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="underline hover:no-underline">Terms of Service</Link>
          {' · '}
          <Link href="/contact" className="underline hover:no-underline">Contact</Link>
        </div>
      </div>
    </div>
  );
}

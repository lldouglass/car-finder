import Link from 'next/link';
import { ArrowLeft, BookOpen, ArrowRight } from 'lucide-react';
import { getAllPosts } from '@/lib/blog';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Used Car Reliability Blog | Car Lifespan Check',
  description:
    'Expert guides on used car reliability, longevity, maintenance tips, and buying advice. Make smarter used car decisions with data-driven insights.',
  alternates: {
    canonical: 'https://carlifespancheck.com/blog',
  },
};

const TAG_COLORS: Record<string, string> = {
  reliability: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  'buying guide': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  longevity: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  budget: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  safety: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] || 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
}

export default function BlogPage() {
  const posts = getAllPosts();
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Analyzer</span>
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-zinc-900 dark:bg-zinc-100">
              <BookOpen className="size-5 text-white dark:text-zinc-900" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Car Reliability Blog
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Data-driven guides to help you find reliable used cars, avoid costly
            mistakes, and keep your vehicle running longer.
          </p>
        </header>

        {/* Featured Post */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block mb-10">
            <article className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-500 dark:to-indigo-600 h-2" />
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Featured
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(featured.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground mb-4 max-w-2xl leading-relaxed">
                  {featured.description}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read article <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Rest of Posts */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <article className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 h-full flex flex-col transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-3 flex-grow line-clamp-3">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <footer className="mt-14 pt-8 border-t border-border text-center space-y-4">
          <h2 className="text-xl font-semibold">
            Ready to Check a Vehicle&apos;s Reliability?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Use our free analyzer to get reliability scores, safety ratings, and
            longevity predictions for any used car.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Analyze a Vehicle →
          </Link>
        </footer>
      </div>
    </div>
  );
}

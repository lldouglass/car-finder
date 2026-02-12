import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllPosts } from '@/lib/blog';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Used Car Reliability Blog | Car Lifespan Check',
  description:
    'Expert guides on used car reliability, longevity, maintenance tips, and buying advice. Make smarter used car decisions with data-driven insights.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Analyzer</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Car Reliability &amp; Buying Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Data-driven guides to help you find reliable used cars, avoid costly
            mistakes, and keep your vehicle running longer.
          </p>
        </header>

        <div className="grid gap-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <article className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                  {post.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                  {post.description}
                </p>
                <time className="text-xs text-muted-foreground">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </article>
            </Link>
          ))}
        </div>

        <footer className="mt-12 pt-8 border-t border-border text-center space-y-4">
          <h2 className="text-xl font-semibold">
            Ready to Check a Vehicle&apos;s Reliability?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Use our free analyzer to get reliability scores, safety ratings, and
            longevity predictions for any used car.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Analyze a Vehicle
          </Link>
        </footer>
      </div>
    </div>
  );
}

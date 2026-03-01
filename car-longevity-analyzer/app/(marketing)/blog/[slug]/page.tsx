import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ChevronRight } from 'lucide-react';
import { getPostBySlug, getAllSlugs, getAllPosts } from '@/lib/blog';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | Car Lifespan Check`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      url: `https://www.carlifespancheck.com/blog/${slug}`,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const readTime = estimateReadTime(post.content);
  const allPosts = getAllPosts().filter((p) => p.slug !== slug);
  const relatedPosts = allPosts
    .filter((p) => p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3);
  const suggestedPosts = relatedPosts.length >= 2 ? relatedPosts : allPosts.slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: 'https://www.carlifespancheck.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Car Lifespan Check',
      url: 'https://www.carlifespancheck.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.carlifespancheck.com/blog/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Breadcrumb */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight className="size-3.5" />
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
            </nav>
          </div>
        </div>

        {/* Top CTA Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white font-semibold text-sm sm:text-base text-center sm:text-left">
              🚗 Check Your Car&apos;s Lifespan Free
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-white text-blue-700 px-5 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap"
            >
              Try the Analysis Tool →
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <header className="mb-10">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-5 leading-relaxed">
              {post.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                <time>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-4" />
                <span>{readTime} min read</span>
              </div>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{post.author}</span>
            </div>
          </header>

          <article
            className="blog-article max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA Card */}
          <div className="mt-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-8 text-center space-y-4 shadow-sm">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-2">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold">
              Want to Know How Long Your Car Will Last?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try our free analysis tool. Get instant reliability scores, safety ratings,
              recall data, and longevity predictions for any vehicle.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              Try the Free Analysis Tool →
            </Link>
          </div>

          {/* Related Posts */}
          {suggestedPosts.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-bold mb-6">Keep Reading</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {suggestedPosts.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="group">
                    <article className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 h-full transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
                      <h3 className="font-semibold text-sm leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                        {p.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              All Articles
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

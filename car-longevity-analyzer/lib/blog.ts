import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'content', 'blog');

// Legacy slugs that 301 redirect to canonical URLs (avoid sitemap/index cannibalization)
const EXCLUDED_SLUGS = new Set([
  'how-long-does-a-subaru-outback-last',
  'subaru-outback-lifespan-review',
  'how-long-does-mazda-cx5-last-reliability',
]);

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
}

export function getAllPosts(): BlogPostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((name) => name.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      if (EXCLUDED_SLUGS.has(slug)) return null;
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        author: data.author || 'Car Lifespan Check Team',
        tags: data.tags || [],
      };
    })
    .filter((post): post is BlogPostMeta => post !== null);

  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    if (EXCLUDED_SLUGS.has(slug)) return null;
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content: rawContent } = matter(fileContents);

    const processedContent = await remark().use(html).process(rawContent);
    // Strip the leading <h1> from content — the page component renders its own h1 from frontmatter
    let content = processedContent.toString();
    content = content.replace(/^\s*<h1[^>]*>.*?<\/h1>\s*/i, '');

    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      author: data.author || 'Car Lifespan Check Team',
      tags: data.tags || [],
      content,
    };
  } catch {
    return null;
  }
}

export function getAllSlugs(): string[] {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, ''))
    .filter((slug) => !EXCLUDED_SLUGS.has(slug));
}

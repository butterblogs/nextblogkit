import { getCollection } from './db';
import { getEnvConfig, getConfig } from './config';

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export async function generateSitemap(): Promise<string> {
  const env = getEnvConfig();
  const config = getConfig();
  const posts = await getCollection('nbk_posts');
  const categories = await getCollection('nbk_categories');

  const entries: SitemapEntry[] = [];

  // Blog listing page
  entries.push({
    loc: `${env.NEXTBLOGKIT_SITE_URL}${config.basePath}`,
    changefreq: 'daily',
    priority: '0.9',
  });

  // Published posts
  const publishedPosts = await posts
    .find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .project({ slug: 1, updatedAt: 1, publishedAt: 1 })
    .toArray();

  for (const post of publishedPosts) {
    const lastmod = post.updatedAt || post.publishedAt;
    const daysSincePublish = lastmod
      ? Math.floor((Date.now() - new Date(lastmod).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    let changefreq = 'monthly';
    if (daysSincePublish < 7) changefreq = 'daily';
    else if (daysSincePublish < 30) changefreq = 'weekly';

    entries.push({
      loc: `${env.NEXTBLOGKIT_SITE_URL}${config.basePath}/${post.slug}`,
      lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : undefined,
      changefreq,
      priority: '0.8',
    });
  }

  // Category pages
  const allCategories = await categories
    .find({})
    .sort({ order: 1 })
    .project({ slug: 1 })
    .toArray();

  for (const cat of allCategories) {
    entries.push({
      loc: `${env.NEXTBLOGKIT_SITE_URL}${config.basePath}/category/${cat.slug}`,
      changefreq: 'weekly',
      priority: '0.6',
    });
  }

  // Paginated listing pages
  const totalPosts = publishedPosts.length;
  const postsPerPage = 10;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  for (let page = 2; page <= totalPages; page++) {
    entries.push({
      loc: `${env.NEXTBLOGKIT_SITE_URL}${config.basePath}?page=${page}`,
      changefreq: 'weekly',
      priority: '0.5',
    });
  }

  return buildXML(entries);
}

function buildXML(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}${entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : ''}${entry.priority ? `\n    <priority>${entry.priority}</priority>` : ''}
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

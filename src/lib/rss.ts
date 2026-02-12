import { getCollection } from './db';
import { getEnvConfig, getConfig } from './config';

export async function generateRSSFeed(fullContent = false): Promise<string> {
  const env = getEnvConfig();
  const config = getConfig();
  const posts = await getCollection('nbk_posts');

  const publishedPosts = await posts
    .find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(50)
    .toArray();

  const items = publishedPosts
    .map((post) => {
      const postUrl = `${env.NEXTBLOGKIT_SITE_URL}${config.basePath}/${post.slug}`;
      const content = fullContent ? post.contentHTML : post.excerpt;
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date(post.createdAt).toUTCString();

      let enclosure = '';
      if (post.coverImage?.url) {
        enclosure = `\n      <enclosure url="${escapeXml(post.coverImage.url)}" type="image/jpeg" />`;
      }

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description><![CDATA[${content || ''}]]></description>
      <pubDate>${pubDate}</pubDate>${enclosure}${
        post.categories?.length
          ? post.categories.map((c: string) => `\n      <category>${escapeXml(c)}</category>`).join('')
          : ''
      }
    </item>`;
    })
    .join('\n');

  const buildDate = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(env.NEXTBLOGKIT_SITE_NAME)} Blog</title>
    <link>${escapeXml(env.NEXTBLOGKIT_SITE_URL)}${config.basePath}</link>
    <description>Latest posts from ${escapeXml(env.NEXTBLOGKIT_SITE_NAME)}</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${escapeXml(env.NEXTBLOGKIT_SITE_URL)}/api/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

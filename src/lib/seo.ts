import type { BlogPost } from './types';
import { getEnvConfig } from './config';

export interface MetaTags {
  title: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    type: string;
    images: { url: string; width?: number; height?: number; alt?: string }[];
    article?: {
      publishedTime: string;
      modifiedTime: string;
      section?: string;
      tags?: string[];
    };
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: string[];
  };
  robots?: string;
}

export function generateMetaTags(post: BlogPost): MetaTags {
  const env = getEnvConfig();
  const postUrl = `${env.NEXTBLOGKIT_SITE_URL}/blog/${post.slug}`;
  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.excerpt;
  const canonical = post.seo?.canonicalUrl || postUrl;
  const ogImage = post.seo?.ogImage || post.coverImage?.url;

  return {
    title: `${title} | ${env.NEXTBLOGKIT_SITE_NAME}`,
    description,
    canonical,
    openGraph: {
      title,
      description,
      url: postUrl,
      siteName: env.NEXTBLOGKIT_SITE_NAME,
      type: post.seo?.ogType || 'article',
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
      article: {
        publishedTime: post.publishedAt?.toISOString() || '',
        modifiedTime: post.updatedAt.toISOString(),
        section: post.categories[0],
        tags: post.tags,
      },
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    robots: post.seo?.noIndex ? 'noindex, nofollow' : undefined,
  };
}

export interface ArticleStructuredData {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified: string;
  author: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher: {
    '@type': string;
    name: string;
  };
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
  wordCount: number;
  articleSection?: string;
}

export function generateStructuredData(post: BlogPost): ArticleStructuredData {
  const env = getEnvConfig();
  const postUrl = `${env.NEXTBLOGKIT_SITE_URL}/blog/${post.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage?.url || post.seo?.ogImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: post.author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: env.NEXTBLOGKIT_SITE_NAME,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    wordCount: post.wordCount,
    articleSection: post.categories[0],
  };
}

export interface FAQStructuredData {
  '@context': string;
  '@type': string;
  mainEntity: {
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }[];
}

export function generateFAQStructuredData(
  faqItems: { question: string; answer: string }[]
): FAQStructuredData | null {
  if (!faqItems.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export interface BreadcrumbStructuredData {
  '@context': string;
  '@type': string;
  itemListElement: {
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }[];
}

export function generateBreadcrumbs(
  post: BlogPost,
  categoryName?: string
): BreadcrumbStructuredData {
  const env = getEnvConfig();
  const items: BreadcrumbStructuredData['itemListElement'] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: env.NEXTBLOGKIT_SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: `${env.NEXTBLOGKIT_SITE_URL}/blog`,
    },
  ];

  if (categoryName && post.categories[0]) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: categoryName,
      item: `${env.NEXTBLOGKIT_SITE_URL}/blog/category/${post.categories[0]}`,
    });
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: post.title,
    });
  } else {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: post.title,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

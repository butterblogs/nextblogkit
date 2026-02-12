import { z } from 'zod';
import type { NextBlogKitConfig } from './types';

const envSchema = z.object({
  // Required
  NEXTBLOGKIT_MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  NEXTBLOGKIT_API_KEY: z.string().min(32, 'API key must be at least 32 characters'),

  // Optional — Database name (defaults to the database in your connection URI)
  NEXTBLOGKIT_MONGODB_DB: z.string().optional(),

  // Optional — Cloudflare R2 (image storage)
  NEXTBLOGKIT_R2_ACCOUNT_ID: z.string().optional(),
  NEXTBLOGKIT_R2_ACCESS_KEY: z.string().optional(),
  NEXTBLOGKIT_R2_SECRET_KEY: z.string().optional(),
  NEXTBLOGKIT_R2_BUCKET: z.string().optional(),
  NEXTBLOGKIT_R2_PUBLIC_URL: z.string().optional(),

  // Optional — Site info (defaults provided)
  NEXTBLOGKIT_SITE_URL: z.string().optional().default(''),
  NEXTBLOGKIT_SITE_NAME: z.string().optional().default('Blog'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`NextBlogKit configuration error:\n${missing.join('\n')}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function isR2Configured(): boolean {
  const env = getEnvConfig();
  return !!(
    env.NEXTBLOGKIT_R2_ACCOUNT_ID &&
    env.NEXTBLOGKIT_R2_ACCESS_KEY &&
    env.NEXTBLOGKIT_R2_SECRET_KEY &&
    env.NEXTBLOGKIT_R2_BUCKET &&
    env.NEXTBLOGKIT_R2_PUBLIC_URL
  );
}

const defaultConfig: NextBlogKitConfig = {
  basePath: '/blog',
  adminPath: '/admin/blog',
  apiPath: '/api/blog',
  postsPerPage: 10,
  excerptLength: 160,
  codeHighlighter: 'shiki',
  editor: {
    blocks: [
      'paragraph',
      'heading',
      'image',
      'codeBlock',
      'blockquote',
      'bulletList',
      'orderedList',
      'taskList',
      'table',
      'embed',
      'horizontalRule',
      'callout',
      'tableOfContents',
      'faq',
      'html',
    ],
    maxImageSize: 10 * 1024 * 1024,
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    autosaveInterval: 30000,
  },
  seo: {
    titleTemplate: '%s | %siteName%',
    generateRSS: true,
    generateSitemap: true,
    structuredData: true,
    minContentLength: 300,
  },
  auth: {
    strategy: 'api-key',
  },
  features: {
    search: true,
    relatedPosts: true,
    readingProgress: true,
    tableOfContents: true,
    shareButtons: true,
    darkMode: true,
    scheduling: true,
    revisionHistory: true,
    imageOptimization: true,
  },
  theme: {
    darkMode: true,
    variables: {
      '--nbk-primary': '#2563eb',
      '--nbk-primary-hover': '#1d4ed8',
      '--nbk-text': '#1f2937',
      '--nbk-text-muted': '#6b7280',
      '--nbk-bg': '#ffffff',
      '--nbk-bg-secondary': '#f9fafb',
      '--nbk-card-bg': '#ffffff',
      '--nbk-border': '#e5e7eb',
      '--nbk-radius': '0.5rem',
      '--nbk-font-heading': '"Inter", system-ui, sans-serif',
      '--nbk-font-body': '"Inter", system-ui, sans-serif',
      '--nbk-font-code': '"JetBrains Mono", "Fira Code", monospace',
    },
  },
  hooks: {},
};

let cachedConfig: NextBlogKitConfig | null = null;

export function defineConfig(config: Partial<NextBlogKitConfig>): Partial<NextBlogKitConfig> {
  return config;
}

export function getConfig(userConfig?: Partial<NextBlogKitConfig>): NextBlogKitConfig {
  if (cachedConfig && !userConfig) return cachedConfig;

  const merged: NextBlogKitConfig = {
    ...defaultConfig,
    ...userConfig,
    editor: { ...defaultConfig.editor, ...userConfig?.editor },
    seo: { ...defaultConfig.seo, ...userConfig?.seo },
    auth: { ...defaultConfig.auth, ...userConfig?.auth },
    features: { ...defaultConfig.features, ...userConfig?.features },
    theme: {
      ...defaultConfig.theme,
      ...userConfig?.theme,
      variables: { ...defaultConfig.theme.variables, ...userConfig?.theme?.variables },
    },
    hooks: { ...defaultConfig.hooks, ...userConfig?.hooks },
  };

  if (!userConfig) {
    cachedConfig = merged;
  }

  return merged;
}

export function getBlogConfig() {
  const env = getEnvConfig();
  const config = getConfig();

  return {
    ...config,
    siteUrl: env.NEXTBLOGKIT_SITE_URL,
    siteName: env.NEXTBLOGKIT_SITE_NAME,
    metadata: {
      title: `Blog | ${env.NEXTBLOGKIT_SITE_NAME}`,
      description: `Latest posts from ${env.NEXTBLOGKIT_SITE_NAME}`,
      openGraph: {
        title: `Blog | ${env.NEXTBLOGKIT_SITE_NAME}`,
        description: `Latest posts from ${env.NEXTBLOGKIT_SITE_NAME}`,
        url: `${env.NEXTBLOGKIT_SITE_URL}${config.basePath}`,
        siteName: env.NEXTBLOGKIT_SITE_NAME,
        type: 'website',
      },
    },
  };
}

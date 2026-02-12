import { z } from 'zod';
import type { ObjectId } from 'mongodb';

// ============================================================
// Block Editor Types
// ============================================================

export const BlockTypeSchema = z.enum([
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
]);

export type BlockType = z.infer<typeof BlockTypeSchema>;

export interface BlockContent {
  type: string;
  attrs?: Record<string, unknown>;
  content?: BlockContent[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

// ============================================================
// Media
// ============================================================

export interface MediaReference {
  _id: string;
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export const MediaSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  r2Key: z.string(),
  url: z.string().url(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  createdAt: z.date(),
});

export interface Media {
  _id: ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  r2Key: string;
  url: string;
  alt?: string;
  caption?: string;
  createdAt: Date;
}

// ============================================================
// Author
// ============================================================

export const AuthorSchema = z.object({
  name: z.string().min(1),
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
  url: z.string().url().optional(),
});

export interface Author {
  name: string;
  avatar?: string;
  bio?: string;
  url?: string;
}

// ============================================================
// SEO
// ============================================================

export const PostSEOSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  ogImage: z.string().url().optional(),
  ogType: z.string().default('article'),
  noIndex: z.boolean().default(false),
  structuredData: z.record(z.unknown()).optional(),
  focusKeyword: z.string().optional(),
});

export interface PostSEO {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType: string;
  noIndex: boolean;
  structuredData?: Record<string, unknown>;
  focusKeyword?: string;
}

// ============================================================
// Revision
// ============================================================

export interface Revision {
  version: number;
  title: string;
  content: BlockContent[];
  contentHTML: string;
  savedAt: Date;
}

// ============================================================
// Post
// ============================================================

export const PostStatusSchema = z.enum(['draft', 'published', 'scheduled', 'archived']);
export type PostStatus = z.infer<typeof PostStatusSchema>;

export const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.any(), // BlockContent[] — validated structurally
  contentHTML: z.string().optional(),
  contentText: z.string().optional(),
  coverImage: z
    .object({
      _id: z.string(),
      url: z.string().url(),
      alt: z.string().optional(),
      caption: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  author: AuthorSchema.optional(),
  seo: PostSEOSchema.optional(),
  status: PostStatusSchema.default('draft'),
  publishedAt: z.coerce.date().optional(),
  scheduledAt: z.coerce.date().optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial();

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

export interface BlogPost {
  _id: ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: BlockContent[];
  contentHTML: string;
  contentText: string;
  coverImage?: MediaReference;
  categories: string[];
  tags: string[];
  author: Author;
  seo: PostSEO;
  status: PostStatus;
  publishedAt?: Date;
  scheduledAt?: Date;
  readingTime: number;
  wordCount: number;
  version: number;
  revisions: Revision[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Category
// ============================================================

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
  order: z.number().default(0),
  parentId: z.string().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export interface Category {
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  order: number;
  parentId?: ObjectId;
  postCount: number;
}

// ============================================================
// Settings
// ============================================================

export const BlogSettingsSchema = z.object({
  postsPerPage: z.number().min(1).max(100).default(10),
  defaultAuthor: AuthorSchema.optional(),
  defaultOgImage: z.string().url().optional(),
  commentSystem: z.enum(['none', 'giscus', 'disqus']).default('none'),
  commentConfig: z.record(z.unknown()).optional(),
  customCSS: z.string().optional(),
  analytics: z
    .object({
      gaId: z.string().optional(),
      plausibleDomain: z.string().optional(),
    })
    .optional(),
});

export interface BlogSettings {
  _id: string;
  postsPerPage: number;
  defaultAuthor?: Author;
  defaultOgImage?: string;
  commentSystem: 'none' | 'giscus' | 'disqus';
  commentConfig?: Record<string, unknown>;
  customCSS?: string;
  analytics?: {
    gaId?: string;
    plausibleDomain?: string;
  };
}

// ============================================================
// API Tokens
// ============================================================

export const CreateApiTokenSchema = z.object({
  name: z.string().min(1, 'Token name is required').max(100),
});

export interface ApiToken {
  _id: ObjectId;
  name: string;
  tokenHash: string;
  prefix: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================
// SEO Score Types
// ============================================================

export type SEOCheckStatus = 'pass' | 'warn' | 'fail';
export type SEOOverallScore = 'good' | 'ok' | 'poor';

export interface SEOCheck {
  id: string;
  status: SEOCheckStatus;
  message: string;
}

export interface SEOScore {
  overall: SEOOverallScore;
  checks: SEOCheck[];
}

// ============================================================
// Config Types
// ============================================================

export interface NextBlogKitConfig {
  basePath: string;
  adminPath: string;
  apiPath: string;
  postsPerPage: number;
  excerptLength: number;
  codeHighlighter: 'shiki' | 'prism';
  editor: {
    blocks: BlockType[];
    maxImageSize: number;
    imageFormats: string[];
    autosaveInterval: number;
  };
  seo: {
    titleTemplate: string;
    defaultOgImage?: string;
    generateRSS: boolean;
    generateSitemap: boolean;
    structuredData: boolean;
    minContentLength: number;
  };
  auth: {
    strategy: 'api-key' | 'custom' | 'credentials';
    verify?: (request: Request) => Promise<boolean>;
    admins?: string[];
  };
  features: {
    search: boolean;
    relatedPosts: boolean;
    readingProgress: boolean;
    tableOfContents: boolean;
    shareButtons: boolean;
    darkMode: boolean;
    scheduling: boolean;
    revisionHistory: boolean;
    imageOptimization: boolean;
  };
  theme: {
    variables?: Record<string, string>;
    darkMode?: boolean;
    components?: Record<string, React.ComponentType<unknown>>;
  };
  hooks: {
    beforePublish?: (post: BlogPost) => Promise<void>;
    afterPublish?: (post: BlogPost) => Promise<void>;
    beforeDelete?: (post: BlogPost) => Promise<void>;
    onMediaUpload?: (media: Media) => Promise<void>;
  };
}

// ============================================================
// Query Types
// ============================================================

export interface PostListQuery {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  status?: PostStatus;
  search?: string;
  sortBy?: 'publishedAt' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaListQuery {
  page?: number;
  limit?: number;
  mimeType?: string;
}

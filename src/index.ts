// NextBlogKit — Main Entry Point

// Config
export { defineConfig, getConfig, getEnvConfig, getBlogConfig } from './lib/config';

// Database
export {
  getDb,
  getCollection,
  ensureIndexes,
  createPost,
  updatePost,
  deletePost,
  getPostBySlug,
  getPostById,
  listPosts,
  createCategory,
  updateCategory,
  deleteCategory,
  listCategories,
  getCategoryBySlug,
  createMedia,
  deleteMedia,
  listMedia,
  getSettings,
  updateSettings,
} from './lib/db';

// Storage
export { R2StorageProvider } from './lib/storage';

// Utilities
export { generateSlug, ensureUniqueSlug } from './lib/slug';
export { calculateReadingTime, countWords, extractTextFromHTML, extractTextFromBlocks } from './lib/reading-time';
export { searchPosts } from './lib/search';

// SEO
export { generateMetaTags, generateStructuredData, generateFAQStructuredData, generateBreadcrumbs } from './lib/seo';
export { calculateSEOScore } from './lib/seo-scorer';
export { generateSitemap } from './lib/sitemap';
export { generateRSSFeed } from './lib/rss';

// Image Processing
export { processImage } from './lib/image';

// Editor
export { renderBlocksToHTML, extractHeadings, extractFAQItems } from './editor/renderer';

// Types
export type {
  BlogPost,
  Category,
  Media,
  BlogSettings,
  Author,
  PostSEO,
  PostStatus,
  BlockContent,
  BlockType,
  MediaReference,
  Revision,
  CreatePostInput,
  UpdatePostInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  PostListQuery,
  MediaListQuery,
  NextBlogKitConfig,
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  SEOScore,
  SEOCheck,
  SEOCheckStatus,
  SEOOverallScore,
} from './lib/types';

import { MongoClient, type Db, type Collection, type Document, ObjectId } from 'mongodb';
import { getEnvConfig } from './config';
import type {
  BlogPost,
  Category,
  Media,
  BlogSettings,
  CreatePostInput,
  UpdatePostInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  PostListQuery,
  MediaListQuery,
} from './types';
import { generateSlug, ensureUniqueSlug } from './slug';
import { calculateReadingTime, countWords, extractTextFromBlocks } from './reading-time';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  const env = getEnvConfig();
  client = new MongoClient(env.NEXTBLOGKIT_MONGODB_URI);
  await client.connect();
  db = client.db();
  return db;
}

export async function getCollection<T extends Document = Document>(
  name: string
): Promise<Collection<T>> {
  const database = await getDb();
  return database.collection<T>(name);
}

export async function ensureIndexes(): Promise<void> {
  const database = await getDb();

  const posts = database.collection('nbk_posts');
  await posts.createIndex({ slug: 1 }, { unique: true });
  await posts.createIndex({ status: 1, publishedAt: -1 });
  await posts.createIndex({ categories: 1, status: 1 });
  await posts.createIndex({ tags: 1, status: 1 });
  await posts.createIndex({ 'seo.focusKeyword': 1 });
  await posts.createIndex({ contentText: 'text', title: 'text', excerpt: 'text' });

  const categories = database.collection('nbk_categories');
  await categories.createIndex({ slug: 1 }, { unique: true });
  await categories.createIndex({ order: 1 });

  const media = database.collection('nbk_media');
  await media.createIndex({ createdAt: -1 });
  await media.createIndex({ r2Key: 1 }, { unique: true });
}

// ============================================================
// Posts
// ============================================================

export async function createPost(input: CreatePostInput, defaultAuthor?: BlogPost['author']): Promise<BlogPost> {
  const col = await getCollection('nbk_posts');

  const slug = await ensureUniqueSlug(
    input.slug || generateSlug(input.title),
    col
  );

  const contentText = input.contentText || extractTextFromBlocks(input.content || []);
  const wordCount = countWords(contentText);
  const readingTime = calculateReadingTime(contentText);

  const excerpt =
    input.excerpt || contentText.slice(0, 160).replace(/\s+\S*$/, '') + '...';

  const now = new Date();
  const doc = {
    title: input.title,
    slug,
    excerpt,
    content: input.content || [],
    contentHTML: input.contentHTML || '',
    contentText,
    coverImage: input.coverImage,
    categories: input.categories || [],
    tags: input.tags || [],
    author: input.author || defaultAuthor || { name: 'Admin' },
    seo: {
      ogType: 'article',
      noIndex: false,
      ...input.seo,
    },
    status: input.status || 'draft',
    publishedAt: input.status === 'published' ? now : input.publishedAt,
    scheduledAt: input.scheduledAt,
    readingTime,
    wordCount,
    version: 1,
    revisions: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc);
  return { _id: result.insertedId, ...doc } as unknown as BlogPost;
}

export async function updatePost(
  id: string,
  input: UpdatePostInput
): Promise<BlogPost | null> {
  const col = await getCollection('nbk_posts');
  const objectId = new ObjectId(id);
  const existing = await col.findOne({ _id: objectId });
  if (!existing) return null;

  const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };

  if (input.slug && input.slug !== existing.slug) {
    updates.slug = await ensureUniqueSlug(input.slug, col, id);
  }

  if (input.content) {
    const contentText = input.contentText || extractTextFromBlocks(input.content);
    updates.contentText = contentText;
    updates.wordCount = countWords(contentText);
    updates.readingTime = calculateReadingTime(contentText);

    if (!input.excerpt) {
      updates.excerpt =
        contentText.slice(0, 160).replace(/\s+\S*$/, '') + '...';
    }

    // Save revision
    const revision = {
      version: existing.version || 1,
      title: existing.title,
      content: existing.content,
      contentHTML: existing.contentHTML,
      savedAt: new Date(),
    };
    const revisions = [...(existing.revisions || []), revision].slice(-10);
    updates.revisions = revisions;
    updates.version = (existing.version || 1) + 1;
  }

  if (input.status === 'published' && existing.status !== 'published') {
    updates.publishedAt = new Date();
  }

  await col.updateOne({ _id: objectId }, { $set: updates });
  return (await col.findOne({ _id: objectId })) as unknown as BlogPost;
}

export async function deletePost(id: string): Promise<boolean> {
  const col = await getCollection('nbk_posts');
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: 'archived', updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function hardDeletePost(id: string): Promise<boolean> {
  const col = await getCollection('nbk_posts');
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const col = await getCollection('nbk_posts');
  return (await col.findOne({ slug })) as unknown as BlogPost | null;
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const col = await getCollection('nbk_posts');
  return (await col.findOne({ _id: new ObjectId(id) })) as unknown as BlogPost | null;
}

export async function listPosts(
  query: PostListQuery = {}
): Promise<{ posts: BlogPost[]; total: number }> {
  const col = await getCollection('nbk_posts');
  const {
    page = 1,
    limit = 10,
    category,
    tag,
    status,
    search,
    sortBy = 'publishedAt',
    sortOrder = 'desc',
  } = query;

  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = status;
  } else {
    filter.status = { $ne: 'archived' };
  }

  if (category) filter.categories = category;
  if (tag) filter.tags = tag;
  if (search) {
    filter.$text = { $search: search };
  }

  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    col.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);

  return {
    posts: posts as unknown as BlogPost[],
    total,
  };
}

// ============================================================
// Categories
// ============================================================

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const col = await getCollection('nbk_categories');
  const slug = await ensureUniqueSlug(
    input.slug || generateSlug(input.name),
    col
  );

  const doc = {
    name: input.name,
    slug,
    description: input.description,
    seo: input.seo,
    order: input.order ?? 0,
    parentId: input.parentId ? new ObjectId(input.parentId) : undefined,
    postCount: 0,
  };

  const result = await col.insertOne(doc);
  return { _id: result.insertedId, ...doc } as unknown as Category;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<Category | null> {
  const col = await getCollection('nbk_categories');
  const objectId = new ObjectId(id);

  const updates: Record<string, unknown> = { ...input };
  if (input.slug) {
    updates.slug = await ensureUniqueSlug(input.slug, col, id);
  }
  if (input.parentId) {
    updates.parentId = new ObjectId(input.parentId);
  }

  await col.updateOne({ _id: objectId }, { $set: updates });
  return (await col.findOne({ _id: objectId })) as unknown as Category | null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const col = await getCollection('nbk_categories');
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function listCategories(): Promise<Category[]> {
  const col = await getCollection('nbk_categories');
  return (await col.find({}).sort({ order: 1 }).toArray()) as unknown as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const col = await getCollection('nbk_categories');
  return (await col.findOne({ slug })) as unknown as Category | null;
}

export async function updateCategoryPostCount(categorySlug: string): Promise<void> {
  const posts = await getCollection('nbk_posts');
  const categories = await getCollection('nbk_categories');
  const count = await posts.countDocuments({
    categories: categorySlug,
    status: 'published',
  });
  await categories.updateOne({ slug: categorySlug }, { $set: { postCount: count } });
}

// ============================================================
// Media
// ============================================================

export async function createMedia(data: Omit<Media, '_id'>): Promise<Media> {
  const col = await getCollection('nbk_media');
  const result = await col.insertOne(data);
  return { _id: result.insertedId, ...data } as unknown as Media;
}

export async function deleteMedia(id: string): Promise<Media | null> {
  const col = await getCollection('nbk_media');
  const media = await col.findOne({ _id: new ObjectId(id) });
  if (!media) return null;
  await col.deleteOne({ _id: new ObjectId(id) });
  return media as unknown as Media;
}

export async function listMedia(
  query: MediaListQuery = {}
): Promise<{ media: Media[]; total: number }> {
  const col = await getCollection('nbk_media');
  const { page = 1, limit = 20, mimeType } = query;

  const filter: Record<string, unknown> = {};
  if (mimeType) filter.mimeType = { $regex: mimeType };

  const skip = (page - 1) * limit;
  const [media, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);

  return { media: media as unknown as Media[], total };
}

// ============================================================
// Settings
// ============================================================

export async function getSettings(): Promise<BlogSettings> {
  const col = await getCollection('nbk_settings');
  const settings = await col.findOne({ _id: 'global' as unknown as ObjectId });
  if (!settings) {
    const defaults: Record<string, unknown> = {
      _id: 'global',
      postsPerPage: 10,
      commentSystem: 'none',
    };
    await col.insertOne(defaults as Document);
    return defaults as unknown as BlogSettings;
  }
  return settings as unknown as BlogSettings;
}

export async function updateSettings(
  data: Partial<BlogSettings>
): Promise<BlogSettings> {
  const col = await getCollection('nbk_settings');
  const { _id, ...updates } = data as Record<string, unknown>;
  await col.updateOne(
    { _id: 'global' as unknown as ObjectId },
    { $set: updates },
    { upsert: true }
  );
  return getSettings();
}

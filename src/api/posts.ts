import { NextResponse } from 'next/server';
import {
  listPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from '../lib/db';
import { CreatePostSchema, UpdatePostSchema, type PostStatus } from '../lib/types';
import {
  jsonSuccess,
  jsonError,
  requireAuth,
  getSearchParams,
  parseIntParam,
} from './middleware';

export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);

    // Single post by slug
    if (params.slug) {
      const post = await getPostBySlug(params.slug);
      if (!post) return jsonError('NOT_FOUND', 'Post not found', 404);
      return jsonSuccess(post);
    }

    // Single post by id
    if (params.id) {
      const post = await getPostById(params.id);
      if (!post) return jsonError('NOT_FOUND', 'Post not found', 404);
      return jsonSuccess(post);
    }

    // List posts
    const result = await listPosts({
      page: parseIntParam(params.page, 1),
      limit: parseIntParam(params.limit, 10),
      category: params.category,
      tag: params.tag,
      status: params.status as PostStatus | undefined,
      search: params.q || params.search,
      sortBy: (params.sortBy as 'publishedAt' | 'createdAt' | 'title') || 'publishedAt',
      sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc',
    });

    const page = parseIntParam(params.page, 1);
    const limit = parseIntParam(params.limit, 10);

    return jsonSuccess(result.posts, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error('[nextblogkit] GET /posts error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch posts', 500);
  }
}

export async function POST(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = CreatePostSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return jsonError('VALIDATION_ERROR', errors.join('; '));
    }

    const post = await createPost(parsed.data);
    return jsonSuccess(post, undefined, 201);
  } catch (error) {
    console.error('[nextblogkit] POST /posts error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to create post', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const params = getSearchParams(request);
    const id = params.id;
    if (!id) return jsonError('MISSING_ID', 'Post ID is required');

    const body = await request.json();
    const parsed = UpdatePostSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return jsonError('VALIDATION_ERROR', errors.join('; '));
    }

    const post = await updatePost(id, parsed.data);
    if (!post) return jsonError('NOT_FOUND', 'Post not found', 404);

    return jsonSuccess(post);
  } catch (error) {
    console.error('[nextblogkit] PUT /posts error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to update post', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const params = getSearchParams(request);
    const id = params.id;
    if (!id) return jsonError('MISSING_ID', 'Post ID is required');

    const deleted = await deletePost(id);
    if (!deleted) return jsonError('NOT_FOUND', 'Post not found', 404);

    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error('[nextblogkit] DELETE /posts error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to delete post', 500);
  }
}

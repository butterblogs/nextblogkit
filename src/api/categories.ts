import {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../lib/db';
import { CreateCategorySchema, UpdateCategorySchema } from '../lib/types';
import { jsonSuccess, jsonError, requireAuth, getSearchParams } from './middleware';

export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);

    if (params.slug) {
      const category = await getCategoryBySlug(params.slug);
      if (!category) return jsonError('NOT_FOUND', 'Category not found', 404);
      return jsonSuccess(category);
    }

    const categories = await listCategories();
    return jsonSuccess(categories);
  } catch (error) {
    console.error('[nextblogkit] GET /categories error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch categories', 500);
  }
}

export async function POST(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = CreateCategorySchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return jsonError('VALIDATION_ERROR', errors.join('; '));
    }

    const category = await createCategory(parsed.data);
    return jsonSuccess(category, undefined, 201);
  } catch (error) {
    console.error('[nextblogkit] POST /categories error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to create category', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const params = getSearchParams(request);
    const id = params.id;
    if (!id) return jsonError('MISSING_ID', 'Category ID is required');

    const body = await request.json();
    const parsed = UpdateCategorySchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return jsonError('VALIDATION_ERROR', errors.join('; '));
    }

    const category = await updateCategory(id, parsed.data);
    if (!category) return jsonError('NOT_FOUND', 'Category not found', 404);

    return jsonSuccess(category);
  } catch (error) {
    console.error('[nextblogkit] PUT /categories error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to update category', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const params = getSearchParams(request);
    const id = params.id;
    if (!id) return jsonError('MISSING_ID', 'Category ID is required');

    const deleted = await deleteCategory(id);
    if (!deleted) return jsonError('NOT_FOUND', 'Category not found', 404);

    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error('[nextblogkit] DELETE /categories error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to delete category', 500);
  }
}

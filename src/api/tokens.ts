import { createApiToken, listApiTokens, deleteApiToken } from '../lib/db';
import { CreateApiTokenSchema } from '../lib/types';
import { jsonSuccess, jsonError, requireMasterAuth, getSearchParams } from './middleware';

export async function GET(request: Request) {
  try {
    const authError = requireMasterAuth(request);
    if (authError) return authError;

    const tokens = await listApiTokens();
    return jsonSuccess(tokens);
  } catch (error) {
    console.error('[nextblogkit] GET /tokens error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch tokens', 500);
  }
}

export async function POST(request: Request) {
  try {
    const authError = requireMasterAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = CreateApiTokenSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return jsonError('VALIDATION_ERROR', errors.join('; '));
    }

    const { token, plainToken } = await createApiToken(parsed.data.name);
    return jsonSuccess({ ...token, plainToken }, undefined, 201);
  } catch (error) {
    console.error('[nextblogkit] POST /tokens error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to create token', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = requireMasterAuth(request);
    if (authError) return authError;

    const params = getSearchParams(request);
    const id = params.id;
    if (!id) return jsonError('MISSING_ID', 'Token ID is required');

    const deleted = await deleteApiToken(id);
    if (!deleted) return jsonError('NOT_FOUND', 'Token not found', 404);

    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error('[nextblogkit] DELETE /tokens error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to delete token', 500);
  }
}

import { getSettings, updateSettings } from '../lib/db';
import { BlogSettingsSchema } from '../lib/types';
import { jsonSuccess, jsonError, requireAuth } from './middleware';

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const settings = await getSettings();
    return jsonSuccess(settings);
  } catch (error) {
    console.error('[nextblogkit] GET /settings error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch settings', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = BlogSettingsSchema.partial().safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return jsonError('VALIDATION_ERROR', errors.join('; '));
    }

    const settings = await updateSettings(parsed.data);
    return jsonSuccess(settings);
  } catch (error) {
    console.error('[nextblogkit] PUT /settings error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to update settings', 500);
  }
}

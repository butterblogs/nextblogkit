import { createMedia, deleteMedia, listMedia } from '../lib/db';
import { R2StorageProvider } from '../lib/storage';
import { processImage } from '../lib/image';
import { getEnvConfig, isR2Configured } from '../lib/config';
import {
  jsonSuccess,
  jsonError,
  requireAuth,
  getSearchParams,
  parseIntParam,
} from './middleware';

export async function GET(request: Request) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const params = getSearchParams(request);
    const result = await listMedia({
      page: parseIntParam(params.page, 1),
      limit: parseIntParam(params.limit, 20),
      mimeType: params.mimeType,
    });

    const page = parseIntParam(params.page, 1);
    const limit = parseIntParam(params.limit, 20);

    return jsonSuccess(result.media, {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error('[nextblogkit] GET /media error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch media', 500);
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return jsonError('MISSING_FILE', 'File is required');
    }

    if (!isR2Configured()) {
      return jsonError(
        'STORAGE_NOT_CONFIGURED',
        'Image upload requires Cloudflare R2. Set R2 environment variables to enable uploads.',
        503
      );
    }

    const env = getEnvConfig();
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return jsonError('FILE_TOO_LARGE', 'File must be under 10MB');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
    ];
    if (!allowedTypes.includes(file.type)) {
      return jsonError('INVALID_TYPE', `Allowed types: ${allowedTypes.join(', ')}`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = new R2StorageProvider();

    const isImage = file.type.startsWith('image/') && file.type !== 'image/svg+xml';
    let uploadResult;
    let width: number | undefined;
    let height: number | undefined;

    if (isImage) {
      const processed = await processImage(buffer, file.name, storage);
      uploadResult = processed.original;
      width = processed.width;
      height = processed.height;
    } else {
      uploadResult = await storage.upload(buffer, file.name, file.type);
    }

    const media = await createMedia({
      filename: uploadResult.key.split('/').pop() || file.name,
      originalName: file.name,
      mimeType: uploadResult.contentType,
      size: uploadResult.size,
      width,
      height,
      r2Key: uploadResult.key,
      url: uploadResult.url,
      alt: (formData.get('alt') as string) || '',
      caption: (formData.get('caption') as string) || '',
      createdAt: new Date(),
    });

    return jsonSuccess(media, undefined, 201);
  } catch (error) {
    console.error('[nextblogkit] POST /media error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to upload media', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const params = getSearchParams(request);
    const id = params.id;
    if (!id) return jsonError('MISSING_ID', 'Media ID is required');

    const media = await deleteMedia(id);
    if (!media) return jsonError('NOT_FOUND', 'Media not found', 404);

    // Delete from R2
    const storage = new R2StorageProvider();
    await storage.delete(media.r2Key).catch((err) => {
      console.error('[nextblogkit] Failed to delete from R2:', err);
    });

    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error('[nextblogkit] DELETE /media error:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to delete media', 500);
  }
}

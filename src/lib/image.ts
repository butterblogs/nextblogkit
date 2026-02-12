import type { R2StorageProvider, MediaUploadResult } from './storage';

export interface ProcessedImage {
  original: MediaUploadResult;
  width: number;
  height: number;
  format: string;
}

const RESPONSIVE_SIZES = [640, 768, 1024, 1280, 1920];

export async function processImage(
  file: Buffer,
  filename: string,
  storage: R2StorageProvider
): Promise<ProcessedImage> {
  let sharp: typeof import('sharp');
  try {
    sharp = (await import('sharp')).default;
  } catch {
    // sharp not available — upload raw file
    const result = await storage.upload(file, filename, getMimeType(filename));
    return {
      original: result,
      width: 0,
      height: 0,
      format: getExtension(filename),
    };
  }

  const image = sharp(file);
  const metadata = await image.metadata();

  // Convert to WebP
  const webpFilename = filename.replace(/\.[^.]+$/, '.webp');
  const webpBuffer = await image.webp({ quality: 85 }).toBuffer();

  const original = await storage.upload(webpBuffer, webpFilename, 'image/webp');

  // Generate responsive sizes in background (non-blocking for the main upload)
  generateResponsiveSizes(file, webpFilename, storage, metadata.width || 0).catch(
    () => {
      // Silently fail responsive generation — originals are sufficient
    }
  );

  return {
    original,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: 'webp',
  };
}

async function generateResponsiveSizes(
  file: Buffer,
  filename: string,
  storage: R2StorageProvider,
  originalWidth: number
): Promise<void> {
  const sharp = (await import('sharp')).default;

  const sizes = RESPONSIVE_SIZES.filter((s) => s < originalWidth);

  await Promise.all(
    sizes.map(async (width) => {
      const resized = await sharp(file)
        .resize(width)
        .webp({ quality: 80 })
        .toBuffer();

      const sizedFilename = filename.replace('.webp', `-${width}w.webp`);
      await storage.upload(resized, sizedFilename, 'image/webp');
    })
  );

  // Generate thumbnail
  const thumb = await sharp(file)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 70 })
    .toBuffer();

  const thumbFilename = filename.replace('.webp', '-thumb.webp');
  await storage.upload(thumb, thumbFilename, 'image/webp');
}

function getMimeType(filename: string): string {
  const ext = getExtension(filename);
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

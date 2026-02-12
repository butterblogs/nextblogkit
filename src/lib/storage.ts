import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getEnvConfig } from './config';
import { randomUUID } from 'crypto';

export interface MediaUploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
}

export interface StorageProvider {
  upload(file: Buffer, filename: string, contentType: string): Promise<MediaUploadResult>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<StorageObject[]>;
}

let clientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (clientInstance) return clientInstance;

  const env = getEnvConfig();
  clientInstance = new S3Client({
    region: 'auto',
    endpoint: `https://${env.NEXTBLOGKIT_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.NEXTBLOGKIT_R2_ACCESS_KEY,
      secretAccessKey: env.NEXTBLOGKIT_R2_SECRET_KEY,
    },
  });

  return clientInstance;
}

function generateKey(filename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = randomUUID().split('-')[0];
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  return `blog/${year}/${month}/${uuid}-${safeName}`;
}

export class R2StorageProvider implements StorageProvider {
  async upload(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<MediaUploadResult> {
    const env = getEnvConfig();
    const client = getS3Client();
    const key = generateKey(filename);

    await client.send(
      new PutObjectCommand({
        Bucket: env.NEXTBLOGKIT_R2_BUCKET,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );

    return {
      key,
      url: `${env.NEXTBLOGKIT_R2_PUBLIC_URL}/${key}`,
      size: file.length,
      contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const env = getEnvConfig();
    const client = getS3Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: env.NEXTBLOGKIT_R2_BUCKET,
        Key: key,
      })
    );
  }

  async list(prefix?: string): Promise<StorageObject[]> {
    const env = getEnvConfig();
    const client = getS3Client();

    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: env.NEXTBLOGKIT_R2_BUCKET,
        Prefix: prefix || 'blog/',
      })
    );

    return (response.Contents || []).map((obj) => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
    }));
  }
}

import { NextResponse } from 'next/server';
import { getEnvConfig } from '../lib/config';
import type { ApiErrorResponse } from '../lib/types';

export function jsonSuccess(data: unknown, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, data, meta }, { status });
}

export function jsonError(code: string, message: string, status = 400): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  ) as NextResponse<ApiErrorResponse>;
}

export async function requireAuth(request: Request): Promise<NextResponse<ApiErrorResponse> | null> {
  const env = getEnvConfig();
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return jsonError('UNAUTHORIZED', 'Authorization header is required', 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  // Fast path: master key
  if (token === env.NEXTBLOGKIT_API_KEY) return null;

  // Check DB tokens
  const { verifyApiToken } = await import('../lib/db');
  const dbToken = await verifyApiToken(token);
  if (dbToken) return null;

  return jsonError('FORBIDDEN', 'Invalid API key', 403);
}

export function requireMasterAuth(request: Request): NextResponse<ApiErrorResponse> | null {
  const env = getEnvConfig();
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return jsonError('UNAUTHORIZED', 'Authorization header is required', 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token !== env.NEXTBLOGKIT_API_KEY) {
    return jsonError('FORBIDDEN', 'Invalid API key', 403);
  }

  return null;
}

export function getSearchParams(request: Request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}

export function parseIntParam(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

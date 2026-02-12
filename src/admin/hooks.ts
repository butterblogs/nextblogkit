'use client';

import { useCallback } from 'react';

let _apiBase = '/api/blog';
let _basePath = '/blog';

export function setApiBase(path: string) {
  _apiBase = path;
}

export function setBasePath(path: string) {
  _basePath = path;
}

export function getBasePath(): string {
  return _basePath;
}

function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('nbk_api_key') || '';
}

function getApiBase(): string {
  return _apiBase;
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const apiKey = getApiKey();
  const url = `${getApiBase()}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data;
}

export function useAdminApi() {
  const get = useCallback(async (path: string) => {
    return apiRequest(path);
  }, []);

  const post = useCallback(async (path: string, body?: unknown) => {
    return apiRequest(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }, []);

  const put = useCallback(async (path: string, body: unknown) => {
    return apiRequest(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }, []);

  const del = useCallback(async (path: string) => {
    return apiRequest(path, { method: 'DELETE' });
  }, []);

  return { get, post, put, del };
}

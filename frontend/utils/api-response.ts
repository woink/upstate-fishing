import type { CacheHeaders } from '@shared/services/cache.ts';
import type { ApiErrorDetails } from '@shared/models/types.ts';

export const CACHE_STATIC = 'public, max-age=3600, stale-while-revalidate=7200';
export const CACHE_DYNAMIC = 'public, max-age=300, stale-while-revalidate=600';

export function apiSuccess<T>(
  data: T,
  headers?: CacheHeaders,
): Response {
  return Response.json(
    { success: true, data, timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': CACHE_STATIC, ...headers } },
  );
}

export function apiSuccessList<T>(
  data: T[],
  headers?: CacheHeaders,
): Response {
  return Response.json(
    { success: true, data, count: data.length, timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': CACHE_STATIC, ...headers } },
  );
}

export function apiError(
  error: string,
  code: string,
  status: number,
  details?: ApiErrorDetails,
): Response {
  return Response.json(
    {
      success: false,
      error: { error, code, ...(details ? { details } : {}) },
      timestamp: new Date().toISOString(),
    },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

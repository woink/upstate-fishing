/**
 * API Proxy Route
 *
 * Proxies all /api/* requests to the backend API.
 * This allows client-side islands to use relative URLs
 * that work regardless of where the user accesses the frontend from.
 *
 * Features:
 * - Forwards client IP and relevant headers
 * - Configurable timeout handling
 */

import { Handlers } from '$fresh/server.ts';

const BACKEND_URL = Deno.env.get('API_URL') ?? 'http://localhost:8000';
const PROXY_TIMEOUT_MS = parseInt(Deno.env.get('PROXY_TIMEOUT_MS') ?? '30000', 10);

/**
 * Extract client IP from request headers
 * Checks common proxy headers in order of preference
 */
function getClientIP(req: Request): string {
  // Check X-Forwarded-For (may contain multiple IPs, take first)
  const forwardedFor = req.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  // Check X-Real-IP
  const realIP = req.headers.get('X-Real-IP');
  if (realIP) return realIP;

  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // Fallback - can't determine client IP
  return 'unknown';
}

/**
 * Build headers to forward to backend
 */
function buildProxyHeaders(req: Request): Headers {
  const url = new URL(req.url);
  const clientIP = getClientIP(req);
  const headers = new Headers();

  // Standard headers
  headers.set('Accept', 'application/json');

  // Forwarded headers for client identification
  headers.set('X-Forwarded-For', clientIP);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Real-IP', clientIP);

  // Forward User-Agent if present
  const userAgent = req.headers.get('User-Agent');
  if (userAgent) {
    headers.set('User-Agent', userAgent);
  }

  return headers;
}

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const path = ctx.params.path;
    const url = new URL(req.url);
    const backendUrl = `${BACKEND_URL}/api/${path}${url.search}`;

    try {
      const headers = buildProxyHeaders(req);

      const res = await fetchWithTimeout(
        backendUrl,
        { headers },
        PROXY_TIMEOUT_MS,
      );

      const body = await res.text();

      return new Response(body, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
        },
      });
    } catch (error) {
      // Handle timeout specifically
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`Proxy timeout for /api/${path} after ${PROXY_TIMEOUT_MS}ms`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Gateway timeout',
            code: 'GATEWAY_TIMEOUT',
          }),
          {
            status: 504,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      console.error(`Proxy error for /api/${path}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Backend unavailable',
          code: 'BAD_GATEWAY',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },

  async POST(req, ctx) {
    const path = ctx.params.path;
    const url = new URL(req.url);
    const backendUrl = `${BACKEND_URL}/api/${path}${url.search}`;

    try {
      const body = await req.text();
      const headers = buildProxyHeaders(req);
      headers.set('Content-Type', req.headers.get('Content-Type') ?? 'application/json');

      const res = await fetchWithTimeout(
        backendUrl,
        {
          method: 'POST',
          headers,
          body,
        },
        PROXY_TIMEOUT_MS,
      );

      const responseBody = await res.text();

      return new Response(responseBody, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
        },
      });
    } catch (error) {
      // Handle timeout specifically
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`Proxy timeout for POST /api/${path} after ${PROXY_TIMEOUT_MS}ms`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Gateway timeout',
            code: 'GATEWAY_TIMEOUT',
          }),
          {
            status: 504,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      console.error(`Proxy error for POST /api/${path}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Backend unavailable',
          code: 'BAD_GATEWAY',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
};

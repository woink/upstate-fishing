/**
 * API Proxy Route
 *
 * Proxies all /api/* requests to the backend API.
 * This allows client-side islands to use relative URLs
 * that work regardless of where the user accesses the frontend from.
 *
 * Features:
 * - Path-based cache control headers
 * - stale-while-revalidate for better UX
 */

import { Handlers } from '$fresh/server.ts';

const BACKEND_URL = Deno.env.get('API_URL') ?? 'http://localhost:8000';

/**
 * Cache configuration per endpoint pattern.
 * Returns Cache-Control header value.
 *
 * Strategy:
 * - Static data (streams, hatches): cache longer
 * - Dynamic data (conditions): short cache with stale-while-revalidate
 * - POST requests: no cache
 */
function getCacheControl(path: string): string | null {
  // Static stream/hatch list - cache for 1 hour
  if (path === 'streams' || path === 'hatches') {
    return 'public, max-age=3600, stale-while-revalidate=7200';
  }

  // Stream detail (static info about a stream)
  if (path.match(/^streams\/[^/]+$/)) {
    return 'public, max-age=3600, stale-while-revalidate=7200';
  }

  // Conditions data - changes more frequently
  // Cache for 5 minutes, serve stale for 10 more while revalidating
  if (path.includes('/conditions')) {
    return 'public, max-age=300, stale-while-revalidate=600';
  }

  // Station data - also dynamic
  if (path.match(/^stations\//)) {
    return 'public, max-age=300, stale-while-revalidate=600';
  }

  // Default: no caching
  return null;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const path = ctx.params.path;
    const url = new URL(req.url);
    const backendUrl = `${BACKEND_URL}/api/${path}${url.search}`;

    try {
      const res = await fetch(backendUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      const body = await res.text();

      // Build response headers
      const headers: HeadersInit = {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
      };

      // Add cache headers for successful responses
      if (res.ok) {
        const cacheControl = getCacheControl(path);
        if (cacheControl) {
          headers['Cache-Control'] = cacheControl;
        }
      } else {
        // Don't cache errors
        headers['Cache-Control'] = 'no-store';
      }

      return new Response(body, {
        status: res.status,
        headers,
      });
    } catch (error) {
      console.error(`Proxy error for /api/${path}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Backend unavailable',
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
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
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': req.headers.get('Content-Type') ?? 'application/json',
          'Accept': 'application/json',
        },
        body,
      });

      const responseBody = await res.text();

      return new Response(responseBody, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
          'Cache-Control': 'no-store', // Never cache POST responses
        },
      });
    } catch (error) {
      console.error(`Proxy error for POST /api/${path}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Backend unavailable',
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        },
      );
    }
  },
};

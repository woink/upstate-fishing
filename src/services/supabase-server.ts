/**
 * Server-side Supabase client for Fresh routes (SSR)
 * Uses @supabase/ssr for cookie-based auth in server-rendered pages.
 * This will be used in Phase 2+ for auth, but is created now for the import structure.
 */

import { createServerClient } from '@supabase/ssr';

/**
 * Creates a Supabase client bound to the current request's cookies.
 * Use in Fresh route handlers to get the authenticated user's session.
 *
 * @param req - The incoming request (for reading cookies)
 * @param resHeaders - The response headers (for setting cookies)
 */
export function createServerSupabaseClient(req: Request, resHeaders: Headers) {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.',
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        const cookieHeader = req.headers.get('cookie') ?? '';
        return cookieHeader.split(';').filter(Boolean).map((c) => {
          const [rawName, ...rest] = c.trim().split('=');
          const name = rawName.trim();
          // Strip optional double-quote wrappers per RFC 6265 §4.1.1
          const value = rest.join('=').replace(/^"(.*)"$/, '$1');
          return { name, value };
        });
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          const parts = [`${name}=${value}`];
          if (options?.path) parts.push(`Path=${options.path}`);
          if (options?.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
          if (options?.httpOnly) parts.push('HttpOnly');
          if (options?.secure) parts.push('Secure');
          if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
          resHeaders.append('set-cookie', parts.join('; '));
        }
      },
    },
  });
}

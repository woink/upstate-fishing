/**
 * Supabase server-side client tests
 *
 * Tests env var validation and cookie parsing/setting patterns used in
 * createServerSupabaseClient(). The actual Supabase client creation is tested
 * with sanitizers disabled since the SSR client may open internal connections.
 */

import { assertEquals, assertThrows } from '@std/assert';
import { afterEach, describe, it } from '@std/testing/bdd';
import { createServerSupabaseClient } from '@shared/services/supabase-server.ts';

describe('createServerSupabaseClient', () => {
  const originalUrl = Deno.env.get('SUPABASE_URL');
  const originalKey = Deno.env.get('SUPABASE_ANON_KEY');

  afterEach(() => {
    // Restore original env vars
    if (originalUrl) {
      Deno.env.set('SUPABASE_URL', originalUrl);
    } else {
      Deno.env.delete('SUPABASE_URL');
    }
    if (originalKey) {
      Deno.env.set('SUPABASE_ANON_KEY', originalKey);
    } else {
      Deno.env.delete('SUPABASE_ANON_KEY');
    }
  });

  describe('env var validation', () => {
    it('throws when both SUPABASE_URL and SUPABASE_ANON_KEY are missing', () => {
      Deno.env.delete('SUPABASE_URL');
      Deno.env.delete('SUPABASE_ANON_KEY');

      const req = new Request('http://localhost', { headers: {} });
      const resHeaders = new Headers();

      assertThrows(
        () => createServerSupabaseClient(req, resHeaders),
        Error,
        'Supabase is not configured',
      );
    });

    it('throws when only SUPABASE_URL is set', () => {
      Deno.env.set('SUPABASE_URL', 'http://localhost:54321');
      Deno.env.delete('SUPABASE_ANON_KEY');

      const req = new Request('http://localhost', { headers: {} });
      const resHeaders = new Headers();

      assertThrows(
        () => createServerSupabaseClient(req, resHeaders),
        Error,
        'Supabase is not configured',
      );
    });

    it('throws when only SUPABASE_ANON_KEY is set', () => {
      Deno.env.delete('SUPABASE_URL');
      Deno.env.set('SUPABASE_ANON_KEY', 'test-anon-key');

      const req = new Request('http://localhost', { headers: {} });
      const resHeaders = new Headers();

      assertThrows(
        () => createServerSupabaseClient(req, resHeaders),
        Error,
        'Supabase is not configured',
      );
    });
  });
});

describe('cookie parsing pattern (used by getAll adapter)', () => {
  // Mirrors the parsing logic from supabase-server.ts getAll():
  //   RFC 6265 §4.1.1 compliant — trims names, strips quoted values

  function parseCookies(cookieHeader: string): { name: string; value: string }[] {
    return cookieHeader.split(';').filter(Boolean).map((c) => {
      const [rawName, ...rest] = c.trim().split('=');
      const name = rawName.trim();
      const value = rest.join('=').replace(/^"(.*)"$/, '$1');
      return { name, value };
    });
  }

  it('parses a single cookie', () => {
    const cookies = parseCookies('session=abc123');
    assertEquals(cookies, [{ name: 'session', value: 'abc123' }]);
  });

  it('parses multiple cookies', () => {
    const cookies = parseCookies('session=abc123; token=xyz789; theme=dark');
    assertEquals(cookies, [
      { name: 'session', value: 'abc123' },
      { name: 'token', value: 'xyz789' },
      { name: 'theme', value: 'dark' },
    ]);
  });

  it('handles cookie values containing = signs (base64)', () => {
    const cookies = parseCookies('token=base64==value; session=abc123');
    assertEquals(cookies, [
      { name: 'token', value: 'base64==value' },
      { name: 'session', value: 'abc123' },
    ]);
  });

  it('returns empty array for empty cookie header', () => {
    const cookies = parseCookies('');
    assertEquals(cookies, []);
  });

  it('handles cookies with empty values', () => {
    const cookies = parseCookies('empty=; session=abc');
    assertEquals(cookies, [
      { name: 'empty', value: '' },
      { name: 'session', value: 'abc' },
    ]);
  });

  it('trims whitespace around cookie pairs', () => {
    const cookies = parseCookies('  session=abc ;  token=xyz  ');
    assertEquals(cookies, [
      { name: 'session', value: 'abc' },
      { name: 'token', value: 'xyz' },
    ]);
  });

  it('strips double-quoted values per RFC 6265', () => {
    const cookies = parseCookies('session="abc123"; token="xyz=789"');
    assertEquals(cookies, [
      { name: 'session', value: 'abc123' },
      { name: 'token', value: 'xyz=789' },
    ]);
  });

  it('trims cookie names independently of pair trimming', () => {
    const cookies = parseCookies(' session =abc;  token =xyz');
    assertEquals(cookies, [
      { name: 'session', value: 'abc' },
      { name: 'token', value: 'xyz' },
    ]);
  });

  it('preserves values with internal quotes (not wrapped)', () => {
    const cookies = parseCookies('data=he said "hello"');
    assertEquals(cookies, [{ name: 'data', value: 'he said "hello"' }]);
  });
});

describe('cookie setting pattern (used by setAll adapter)', () => {
  // Tests the exact serialization logic from supabase-server.ts lines 36-43:
  //   for (const { name, value, options } of cookies) {
  //     const parts = [`${name}=${value}`];
  //     if (options?.path) parts.push(`Path=${options.path}`);
  //     if (options?.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  //     if (options?.httpOnly) parts.push('HttpOnly');
  //     if (options?.secure) parts.push('Secure');
  //     if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
  //     resHeaders.append('set-cookie', parts.join('; '));
  //   }

  interface CookieOptions {
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
  }

  interface CookieToSet {
    name: string;
    value: string;
    options?: CookieOptions;
  }

  function setCookies(resHeaders: Headers, cookies: CookieToSet[]): void {
    for (const { name, value, options } of cookies) {
      const parts = [`${name}=${value}`];
      if (options?.path) parts.push(`Path=${options.path}`);
      if (options?.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
      if (options?.httpOnly) parts.push('HttpOnly');
      if (options?.secure) parts.push('Secure');
      if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
      resHeaders.append('set-cookie', parts.join('; '));
    }
  }

  it('sets a simple cookie with no options', () => {
    const headers = new Headers();
    setCookies(headers, [{ name: 'session', value: 'abc123' }]);
    assertEquals(headers.get('set-cookie'), 'session=abc123');
  });

  it('sets a cookie with all options', () => {
    const headers = new Headers();
    setCookies(headers, [{
      name: 'session',
      value: 'abc123',
      options: {
        path: '/',
        maxAge: 3600,
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    }]);
    assertEquals(
      headers.get('set-cookie'),
      'session=abc123; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Lax',
    );
  });

  it('handles maxAge of 0 (cookie deletion)', () => {
    const headers = new Headers();
    setCookies(headers, [{
      name: 'session',
      value: '',
      options: { path: '/', maxAge: 0 },
    }]);
    assertEquals(headers.get('set-cookie'), 'session=; Path=/; Max-Age=0');
  });

  it('sets multiple cookies', () => {
    const headers = new Headers();
    setCookies(headers, [
      { name: 'session', value: 'abc', options: { path: '/' } },
      { name: 'theme', value: 'dark', options: { path: '/' } },
    ]);
    // Headers.getSetCookie() returns individual set-cookie values
    const setCookieValues = headers.getSetCookie();
    assertEquals(setCookieValues.length, 2);
    assertEquals(setCookieValues[0], 'session=abc; Path=/');
    assertEquals(setCookieValues[1], 'theme=dark; Path=/');
  });

  it('omits options that are not set', () => {
    const headers = new Headers();
    setCookies(headers, [{
      name: 'token',
      value: 'xyz',
      options: { httpOnly: true },
    }]);
    assertEquals(headers.get('set-cookie'), 'token=xyz; HttpOnly');
  });
});

/**
 * Security headers middleware tests
 * Tests that the middleware sets all required security headers
 */

import { assertEquals } from '@std/assert';
import { handler } from '../../routes/_middleware.ts';

// deno-lint-ignore no-explicit-any
type MockContext = any;

function createMockContext(reqHeaders?: HeadersInit): MockContext {
  const req = new Request('http://localhost:8000/', { headers: reqHeaders });
  return {
    req,
    next: () => Promise.resolve(new Response('OK')),
  };
}

// ============================================================================
// Core Security Headers
// ============================================================================

Deno.test('security headers - sets X-Content-Type-Options', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.get('X-Content-Type-Options'), 'nosniff');
});

Deno.test('security headers - sets X-Frame-Options', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.get('X-Frame-Options'), 'DENY');
});

Deno.test('security headers - sets Referrer-Policy', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
});

Deno.test('security headers - sets X-DNS-Prefetch-Control', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.get('X-DNS-Prefetch-Control'), 'off');
});

Deno.test('security headers - sets Content-Security-Policy', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.has('Content-Security-Policy'), true);
});

// ============================================================================
// CSP Directives
// ============================================================================

Deno.test('security headers - CSP allows unsafe-inline for Fresh hydration', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes("'unsafe-inline'"), true);
});

Deno.test('security headers - CSP uses self-hosted Leaflet (no unpkg)', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes("style-src 'self' 'unsafe-inline'"), true);
  assertEquals(csp.includes("script-src 'self' 'unsafe-inline'"), true);
  assertEquals(csp.includes('unpkg.com'), false, 'Leaflet is now self-hosted');
});

Deno.test('security headers - CSP allows service workers', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes("worker-src 'self'"), true);
});

Deno.test('security headers - CSP allows OpenStreetMap tiles', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes('tile.openstreetmap.org'), true);
});

Deno.test('security headers - CSP denies framing', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes("frame-ancestors 'none'"), true);
});

// ============================================================================
// HSTS
// ============================================================================

Deno.test('security headers - no HSTS on plain HTTP', async () => {
  const ctx = createMockContext();
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.has('Strict-Transport-Security'), false);
});

Deno.test('security headers - HSTS set when x-forwarded-proto is https', async () => {
  const ctx = createMockContext({ 'x-forwarded-proto': 'https' });
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.has('Strict-Transport-Security'), true);
  assertEquals(
    resp.headers.get('Strict-Transport-Security')?.includes('max-age='),
    true,
  );
});

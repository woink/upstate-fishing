/**
 * Security headers middleware tests
 * Tests that the middleware sets all required security headers
 */

import { assertEquals } from '@std/assert';
import { handler } from '../../routes/_middleware.ts';

// deno-lint-ignore no-explicit-any
type MockContext = any;

function createMockContext(reqHeaders?: HeadersInit): { req: Request; ctx: MockContext } {
  const req = new Request('http://localhost:8000/', { headers: reqHeaders });
  const ctx = {
    next: () => Promise.resolve(new Response('OK')),
  };
  return { req, ctx };
}

// ============================================================================
// Core Security Headers
// ============================================================================

Deno.test('security headers - sets X-Content-Type-Options', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  assertEquals(resp.headers.get('X-Content-Type-Options'), 'nosniff');
});

Deno.test('security headers - sets X-Frame-Options', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  assertEquals(resp.headers.get('X-Frame-Options'), 'DENY');
});

Deno.test('security headers - sets Referrer-Policy', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  assertEquals(resp.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
});

Deno.test('security headers - sets X-DNS-Prefetch-Control', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  assertEquals(resp.headers.get('X-DNS-Prefetch-Control'), 'off');
});

Deno.test('security headers - sets Content-Security-Policy', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  assertEquals(resp.headers.has('Content-Security-Policy'), true);
});

// ============================================================================
// CSP Directives
// ============================================================================

Deno.test('security headers - CSP allows unsafe-inline for Fresh hydration', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes("'unsafe-inline'"), true);
});

Deno.test('security headers - CSP allows unpkg.com for Leaflet CSS and JS', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes("style-src 'self' 'unsafe-inline' https://unpkg.com"), true);
  assertEquals(csp.includes("script-src 'self' 'unsafe-inline' https://unpkg.com"), true);
});

Deno.test('security headers - CSP allows OpenStreetMap tiles', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes('tile.openstreetmap.org'), true);
});

Deno.test('security headers - CSP denies framing', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  const csp = resp.headers.get('Content-Security-Policy')!;
  assertEquals(csp.includes("frame-ancestors 'none'"), true);
});

// ============================================================================
// HSTS
// ============================================================================

Deno.test('security headers - no HSTS on plain HTTP', async () => {
  const { req, ctx } = createMockContext();
  const resp = await handler[0](req, ctx as MockContext);
  assertEquals(resp.headers.has('Strict-Transport-Security'), false);
});

Deno.test('security headers - HSTS set when x-forwarded-proto is https', async () => {
  const { req, ctx } = createMockContext({ 'x-forwarded-proto': 'https' });
  const resp = await handler[0](req, ctx as MockContext);
  assertEquals(resp.headers.has('Strict-Transport-Security'), true);
  assertEquals(
    resp.headers.get('Strict-Transport-Security')?.includes('max-age='),
    true,
  );
});

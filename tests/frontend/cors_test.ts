/**
 * CORS middleware tests
 * Tests that the API CORS middleware handles origins and preflight correctly
 */

import { assertEquals } from '@std/assert';
import { handler } from '../../routes/api/_middleware.ts';

// deno-lint-ignore no-explicit-any
type MockContext = any;

function createMockContext(): MockContext {
  return {
    next: () => Promise.resolve(new Response('OK')),
  };
}

// ============================================================================
// Preflight
// ============================================================================

Deno.test('CORS - preflight returns 204', async () => {
  const req = new Request('http://localhost:8000/api/streams', {
    method: 'OPTIONS',
    headers: { origin: 'http://localhost:8000' },
  });
  const resp = await handler[0](req, createMockContext());
  assertEquals(resp.status, 204);
});

// ============================================================================
// Origin Allowlist
// ============================================================================

Deno.test('CORS - allowed origin gets CORS headers', async () => {
  const req = new Request('http://localhost:8000/api/streams', {
    headers: { origin: 'http://localhost:8000' },
  });
  const resp = await handler[0](req, createMockContext());
  assertEquals(resp.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8000');
});

Deno.test('CORS - disallowed origin gets no CORS header', async () => {
  const req = new Request('http://localhost:8000/api/streams', {
    headers: { origin: 'http://evil.com' },
  });
  const resp = await handler[0](req, createMockContext());
  assertEquals(resp.headers.has('Access-Control-Allow-Origin'), false);
});

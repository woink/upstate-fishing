/**
 * CORS middleware tests
 * Tests that the API CORS middleware handles origins and preflight correctly
 */

import { assertEquals } from '@std/assert';
import { handler } from '../../routes/api/_middleware.ts';

// deno-lint-ignore no-explicit-any
type MockContext = any;

function createMockContext(url: string, init?: RequestInit): MockContext {
  const req = new Request(url, init);
  return {
    req,
    next: () => Promise.resolve(new Response('OK')),
  };
}

// ============================================================================
// Preflight
// ============================================================================

Deno.test('CORS - preflight returns 204', async () => {
  const ctx = createMockContext('http://localhost:8000/api/streams', {
    method: 'OPTIONS',
    headers: { origin: 'http://localhost:8000' },
  });
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.status, 204);
  assertEquals(resp.headers.get('Vary'), 'Origin');
});

// ============================================================================
// Origin Allowlist
// ============================================================================

Deno.test('CORS - allowed origin gets CORS headers', async () => {
  const ctx = createMockContext('http://localhost:8000/api/streams', {
    headers: { origin: 'http://localhost:8000' },
  });
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8000');
  assertEquals(resp.headers.get('Vary'), 'Origin');
});

Deno.test('CORS - disallowed origin gets no CORS header', async () => {
  const ctx = createMockContext('http://localhost:8000/api/streams', {
    headers: { origin: 'http://evil.com' },
  });
  const resp = await handler[0](ctx as MockContext);
  assertEquals(resp.headers.has('Access-Control-Allow-Origin'), false);
  assertEquals(resp.headers.get('Vary'), 'Origin');
});

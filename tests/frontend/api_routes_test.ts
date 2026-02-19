/**
 * API Route Tests
 *
 * Fresh API routes serve data directly from backend services
 * (no proxy to a separate backend process).
 *
 * NOTE: These are integration tests that require a running Fresh server.
 * They are ignored by default. Run manually with:
 *   deno test --allow-net -- --filter "API Routes"
 */

import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';

describe('API Routes', { ignore: true }, () => {
  describe('GET /api/streams', () => {
    it('should return streams', async () => {
      const res = await fetch('http://localhost:8001/api/streams');

      assertEquals(res.status, 200);

      const json = await res.json();
      assertExists(json.success);
      assertEquals(json.success, true);
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
    });
  });

  describe('GET /api/streams/:id/conditions', () => {
    it('should return conditions for a stream', async () => {
      const res = await fetch(
        'http://localhost:8001/api/streams/beaverkill/conditions',
      );

      assertEquals(res.status, 200);

      const json = await res.json();
      assertExists(json.success);
      // May fail if USGS is down, but route should work
      if (json.success) {
        assertExists(json.data);
        assertExists(json.data.stream);
      }
    });
  });

  describe('GET /api/hatches', () => {
    it('should return hatches', async () => {
      const res = await fetch('http://localhost:8001/api/hatches');

      assertEquals(res.status, 200);

      const json = await res.json();
      assertExists(json.success);
      assertEquals(json.success, true);
    });
  });
});

describe('TopPicks Island API URL', { ignore: true }, () => {
  it('should use relative URL for API calls from client', async () => {
    const res = await fetch('http://localhost:8001/');
    const html = await res.text();

    const hasLocalhostApiUrl = html.includes('"apiUrl":"http://localhost');

    assertEquals(
      hasLocalhostApiUrl,
      false,
      'apiUrl should not contain localhost - use relative URLs',
    );
  });
});

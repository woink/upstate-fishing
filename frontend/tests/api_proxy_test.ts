/**
 * API Proxy Tests
 *
 * Problem: Frontend islands fetch from apiUrl (localhost:8000),
 * but remote clients can't reach localhost. Need proxy routes.
 *
 * Solution: Proxy /api/* through Fresh to the backend.
 *
 * NOTE: These are integration tests that require running servers.
 * They are ignored by default. Run manually with:
 *   deno test --allow-net -- --filter "API Proxy"
 */

import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';

describe('API Proxy Routes', { ignore: true }, () => {
  describe('GET /api/streams', () => {
    it('should proxy to backend and return streams', async () => {
      // This will fail until we create the proxy route
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
    it('should proxy conditions request to backend', async () => {
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
    it('should proxy hatches request to backend', async () => {
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
    // Fetch the home page and check that apiUrl is relative
    const res = await fetch('http://localhost:8001/');
    const html = await res.text();

    // The island props should use relative URL, not localhost
    // After fix: apiUrl should be "" (relative) or "/api"
    const hasLocalhostApiUrl = html.includes('"apiUrl":"http://localhost');

    assertEquals(
      hasLocalhostApiUrl,
      false,
      'apiUrl should not contain localhost - use relative URLs',
    );
  });
});

/**
 * API route tests
 */

import { assertEquals, assertExists } from '@std/assert';
import { api } from '../src/routes/api.ts';

// ============================================================================
// Stream Endpoints Tests
// ============================================================================

Deno.test('GET /streams - returns all streams', async () => {
  const res = await api.request('/streams');
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
  assertEquals(Array.isArray(data.data), true);
  assertEquals(data.data.length > 0, true, 'Should have streams');
  assertExists(data.count);
  assertExists(data.timestamp);
});

Deno.test('GET /streams?region=catskills - filters by region', async () => {
  const res = await api.request('/streams?region=catskills');
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);

  for (const stream of data.data) {
    assertEquals(stream.region, 'catskills', 'All streams should be in catskills');
  }
});

Deno.test('GET /streams?state=NY - filters by state', async () => {
  const res = await api.request('/streams?state=NY');
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);

  for (const stream of data.data) {
    assertEquals(stream.state, 'NY', 'All streams should be in NY');
  }
});

Deno.test('GET /streams/:id - returns specific stream', async () => {
  const res = await api.request('/streams/beaverkill');
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
  assertEquals(data.data.id, 'beaverkill');
  assertEquals(data.data.name, 'Beaverkill');
});

Deno.test('GET /streams/:id - returns 404 for unknown stream', async () => {
  const res = await api.request('/streams/nonexistent-stream');
  const data = await res.json();

  assertEquals(res.status, 404);
  assertEquals(data.success, false);
  assertExists(data.error);
  assertEquals(data.error.code, 'NOT_FOUND');
});

// ============================================================================
// Hatch Endpoints Tests
// ============================================================================

Deno.test('GET /hatches - returns all hatches', async () => {
  const res = await api.request('/hatches');
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
  assertEquals(Array.isArray(data.data), true);
  assertEquals(data.data.length > 0, true, 'Should have hatches');
});

Deno.test('GET /hatches?order=mayfly - filters by order', async () => {
  const res = await api.request('/hatches?order=mayfly');
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);

  for (const hatch of data.data) {
    assertEquals(hatch.order, 'mayfly', 'All hatches should be mayflies');
  }
});

Deno.test('GET /hatches?month=4 - filters by month', async () => {
  const res = await api.request('/hatches?month=4');
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);

  for (const hatch of data.data) {
    assertEquals(
      hatch.peakMonths.includes(4),
      true,
      `Hatch ${hatch.id} should have April in peakMonths`,
    );
  }
});

Deno.test('GET /hatches/:id - returns specific hatch', async () => {
  const res = await api.request('/hatches/hendrickson');
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
  assertEquals(data.data.id, 'hendrickson');
  assertEquals(data.data.commonName, 'Hendrickson');
});

Deno.test('GET /hatches/:id - returns 404 for unknown hatch', async () => {
  const res = await api.request('/hatches/nonexistent-hatch');
  const data = await res.json();

  assertEquals(res.status, 404);
  assertEquals(data.success, false);
  assertEquals(data.error.code, 'NOT_FOUND');
});

// ============================================================================
// Prediction Endpoint Tests
// ============================================================================

Deno.test('POST /predict - accepts valid request', async () => {
  const res = await api.request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      waterTempF: 54,
      airTempF: 58,
      cloudCoverPercent: 80,
    }),
  });
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
  assertEquals(Array.isArray(data.data), true);
});

Deno.test('POST /predict - returns predictions for Hendrickson conditions', async () => {
  const res = await api.request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      waterTempF: 54,
      airTempF: 58,
      cloudCoverPercent: 80,
      date: '2024-04-15T14:00:00Z',
    }),
  });
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);

  // Should predict Hendrickson in these conditions
  const hendrickson = data.data.find((p: { hatch: { id: string } }) => p.hatch.id === 'hendrickson');
  assertExists(hendrickson, 'Should predict Hendrickson at 54°F in April');
});

Deno.test('POST /predict - handles minimal request', async () => {
  const res = await api.request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json();

  assertEquals(res.status, 200);
  assertEquals(data.success, true);
  assertExists(data.data);
});

Deno.test('POST /predict - validates cloud cover range', async () => {
  const res = await api.request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cloudCoverPercent: 150, // Invalid: over 100
    }),
  });
  const data = await res.json();

  assertEquals(res.status, 400);
  assertEquals(data.success, false);
  assertEquals(data.error.code, 'VALIDATION_ERROR');
});

Deno.test('POST /predict - validates precip probability range', async () => {
  const res = await api.request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      precipProbability: -10, // Invalid: negative
    }),
  });
  const data = await res.json();

  assertEquals(res.status, 400);
  assertEquals(data.success, false);
  assertEquals(data.error.code, 'VALIDATION_ERROR');
});

// ============================================================================
// Response Format Tests
// ============================================================================

Deno.test('API responses include timestamp', async () => {
  const endpoints = ['/streams', '/hatches', '/streams/beaverkill', '/hatches/hendrickson'];

  for (const endpoint of endpoints) {
    const res = await api.request(endpoint);
    const data = await res.json();
    assertExists(data.timestamp, `${endpoint} should include timestamp`);
  }
});

Deno.test('API error responses include error object', async () => {
  const res = await api.request('/streams/nonexistent');
  const data = await res.json();

  assertEquals(data.success, false);
  assertExists(data.error);
  assertExists(data.error.error);
  assertExists(data.error.code);
});

/**
 * API Response utility tests
 * Tests apiSuccess, apiSuccessList, and apiError helpers
 */

import { assertEquals, assertExists } from '@std/assert';
import {
  apiError,
  apiSuccess,
  apiSuccessList,
  CACHE_DYNAMIC,
  CACHE_STATIC,
} from '../utils/api-response.ts';

// ============================================================================
// Cache Constants Tests
// ============================================================================

Deno.test('CACHE_STATIC - has correct value', () => {
  assertEquals(CACHE_STATIC, 'public, max-age=3600, stale-while-revalidate=7200');
});

Deno.test('CACHE_DYNAMIC - has correct value', () => {
  assertEquals(CACHE_DYNAMIC, 'public, max-age=300, stale-while-revalidate=600');
});

// ============================================================================
// apiSuccess Tests
// ============================================================================

Deno.test('apiSuccess - returns 200 status', () => {
  const response = apiSuccess({ id: 'test' });
  assertEquals(response.status, 200);
});

Deno.test('apiSuccess - returns success:true in body', async () => {
  const response = apiSuccess({ id: 'test', name: 'Test Item' });
  const json = await response.json();

  assertEquals(json.success, true);
  assertExists(json.data);
  assertEquals(json.data.id, 'test');
  assertEquals(json.data.name, 'Test Item');
});

Deno.test('apiSuccess - includes timestamp', async () => {
  const response = apiSuccess('data');
  const json = await response.json();

  assertExists(json.timestamp);
  // Timestamp should be a valid ISO string
  const parsed = new Date(json.timestamp);
  assertEquals(isNaN(parsed.getTime()), false);
});

Deno.test('apiSuccess - sets Cache-Control to CACHE_STATIC by default', () => {
  const response = apiSuccess({ id: 'test' });
  assertEquals(response.headers.get('Cache-Control'), CACHE_STATIC);
});

Deno.test('apiSuccess - merges custom headers', () => {
  const response = apiSuccess({ id: 'test' }, { 'X-Cache': 'HIT' });
  assertEquals(response.headers.get('X-Cache'), 'HIT');
  // Cache-Control should still be present
  assertEquals(response.headers.get('Cache-Control'), CACHE_STATIC);
});

Deno.test('apiSuccess - custom headers can override Cache-Control', () => {
  const response = apiSuccess({ id: 'test' }, { 'Cache-Control': 'no-store' });
  assertEquals(response.headers.get('Cache-Control'), 'no-store');
});

// ============================================================================
// apiSuccessList Tests
// ============================================================================

Deno.test('apiSuccessList - returns 200 status', () => {
  const response = apiSuccessList([{ id: '1' }, { id: '2' }]);
  assertEquals(response.status, 200);
});

Deno.test('apiSuccessList - returns data array with count', async () => {
  const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
  const response = apiSuccessList(items);
  const json = await response.json();

  assertEquals(json.success, true);
  assertEquals(Array.isArray(json.data), true);
  assertEquals(json.data.length, 3);
  assertEquals(json.count, 3);
});

Deno.test('apiSuccessList - handles empty array', async () => {
  const response = apiSuccessList([]);
  const json = await response.json();

  assertEquals(json.success, true);
  assertEquals(json.data.length, 0);
  assertEquals(json.count, 0);
});

Deno.test('apiSuccessList - includes timestamp', async () => {
  const response = apiSuccessList([]);
  const json = await response.json();

  assertExists(json.timestamp);
});

Deno.test('apiSuccessList - sets Cache-Control to CACHE_STATIC by default', () => {
  const response = apiSuccessList([]);
  assertEquals(response.headers.get('Cache-Control'), CACHE_STATIC);
});

Deno.test('apiSuccessList - merges custom headers', () => {
  const response = apiSuccessList([], { 'X-Custom': 'value' });
  assertEquals(response.headers.get('X-Custom'), 'value');
});

// ============================================================================
// apiError Tests
// ============================================================================

Deno.test('apiError - returns correct status code', () => {
  const response = apiError('Not Found', 'NOT_FOUND', 404);
  assertEquals(response.status, 404);
});

Deno.test('apiError - returns 400 for validation errors', () => {
  const response = apiError('Invalid input', 'VALIDATION_ERROR', 400);
  assertEquals(response.status, 400);
});

Deno.test('apiError - returns 500 for server errors', () => {
  const response = apiError('Internal error', 'SERVER_ERROR', 500);
  assertEquals(response.status, 500);
});

Deno.test('apiError - returns success:false in body', async () => {
  const response = apiError('Something broke', 'ERROR', 500);
  const json = await response.json();

  assertEquals(json.success, false);
});

Deno.test('apiError - includes error object with message and code', async () => {
  const response = apiError('Stream not found', 'NOT_FOUND', 404);
  const json = await response.json();

  assertExists(json.error);
  assertEquals(json.error.error, 'Stream not found');
  assertEquals(json.error.code, 'NOT_FOUND');
});

Deno.test('apiError - includes details when provided', async () => {
  const details = [{ path: ['waterTempF'], message: 'Expected number' }];
  const response = apiError('Validation failed', 'VALIDATION_ERROR', 400, details);
  const json = await response.json();

  assertExists(json.error.details);
  assertEquals(Array.isArray(json.error.details), true);
  assertEquals(json.error.details[0].path[0], 'waterTempF');
});

Deno.test('apiError - omits details when not provided', async () => {
  const response = apiError('Not found', 'NOT_FOUND', 404);
  const json = await response.json();

  assertEquals('details' in json.error, false);
});

Deno.test('apiError - details can be a string', async () => {
  const response = apiError('Failed', 'ERROR', 500, 'Connection timeout');
  const json = await response.json();

  assertEquals(json.error.details, 'Connection timeout');
});

Deno.test('apiError - sets Cache-Control to no-store', () => {
  const response = apiError('Error', 'ERROR', 500);
  assertEquals(response.headers.get('Cache-Control'), 'no-store');
});

Deno.test('apiError - includes timestamp', async () => {
  const response = apiError('Error', 'ERROR', 500);
  const json = await response.json();

  assertExists(json.timestamp);
});

// ============================================================================
// Content-Type Header Tests
// ============================================================================

Deno.test('apiSuccess - has Content-Type application/json', () => {
  const response = apiSuccess({ id: 'test' });
  assertEquals(response.headers.get('Content-Type'), 'application/json');
});

Deno.test('apiError - has Content-Type application/json', () => {
  const response = apiError('Not found', 'NOT_FOUND', 404);
  assertEquals(response.headers.get('Content-Type'), 'application/json');
});

Deno.test('apiSuccessList - has Content-Type application/json', () => {
  const response = apiSuccessList([]);
  assertEquals(response.headers.get('Content-Type'), 'application/json');
});

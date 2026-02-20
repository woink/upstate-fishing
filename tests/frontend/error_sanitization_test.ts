/**
 * Error sanitization tests
 * Tests that apiError() does not leak internal details in error responses
 */

import { assertEquals } from '@std/assert';
import { apiError } from '../../src/http/api-response.ts';

// ============================================================================
// Details Field Behavior
// ============================================================================

Deno.test('apiError - no details field when details param omitted', async () => {
  const resp = apiError('Something failed', 'INTERNAL_ERROR', 500);
  const body = await resp.json();

  assertEquals(body.success, false);
  assertEquals(body.error.error, 'Something failed');
  assertEquals(body.error.code, 'INTERNAL_ERROR');
  assertEquals('details' in body.error, false, 'Should not have details field');
});

Deno.test('apiError - details field present when explicitly provided', async () => {
  const details = [{ message: 'field required', path: ['name'] }];
  const resp = apiError('Validation failed', 'VALIDATION_ERROR', 400, details);
  const body = await resp.json();

  assertEquals(body.success, false);
  assertEquals('details' in body.error, true, 'Should have details for validation errors');
});

// ============================================================================
// Status Codes
// ============================================================================

Deno.test('apiError - status code is correct', () => {
  const resp = apiError('Not found', 'NOT_FOUND', 404);
  assertEquals(resp.status, 404);
});

// ============================================================================
// Internal Error Safety
// ============================================================================

Deno.test('apiError - 500 response without details does not leak error info', async () => {
  const resp = apiError('Failed to fetch conditions', 'FETCH_ERROR', 500);
  const body = await resp.json();

  assertEquals(body.error.error, 'Failed to fetch conditions');
  assertEquals('details' in body.error, false, 'Internal errors must not leak details');
});

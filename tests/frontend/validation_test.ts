/**
 * Route ID validation tests
 * Tests isValidRouteId() rejects path traversal, XSS, and malformed input
 */

import { assertEquals } from '@std/assert';
import { isValidRouteId } from '../../utils/validation.ts';

// ============================================================================
// Valid IDs
// ============================================================================

Deno.test('isValidRouteId - accepts lowercase alpha', () => {
  assertEquals(isValidRouteId('beaverkill'), true);
});

Deno.test('isValidRouteId - accepts numeric string', () => {
  assertEquals(isValidRouteId('01417500'), true);
});

Deno.test('isValidRouteId - accepts hyphens', () => {
  assertEquals(isValidRouteId('east-branch-delaware'), true);
});

Deno.test('isValidRouteId - accepts underscores', () => {
  assertEquals(isValidRouteId('stream_name'), true);
});

Deno.test('isValidRouteId - accepts single character', () => {
  assertEquals(isValidRouteId('a'), true);
});

// ============================================================================
// Invalid IDs - Security
// ============================================================================

Deno.test('isValidRouteId - rejects path traversal', () => {
  assertEquals(isValidRouteId('../etc/passwd'), false);
});

Deno.test('isValidRouteId - rejects XSS attempt', () => {
  assertEquals(isValidRouteId('<script>alert(1)</script>'), false);
});

// ============================================================================
// Invalid IDs - Structural
// ============================================================================

Deno.test('isValidRouteId - rejects empty string', () => {
  assertEquals(isValidRouteId(''), false);
});

Deno.test('isValidRouteId - rejects string over 100 chars', () => {
  assertEquals(isValidRouteId('a'.repeat(101)), false);
});

Deno.test('isValidRouteId - rejects spaces', () => {
  assertEquals(isValidRouteId('hello world'), false);
});

Deno.test('isValidRouteId - rejects slashes', () => {
  assertEquals(isValidRouteId('foo/bar'), false);
});

Deno.test('isValidRouteId - rejects dots', () => {
  assertEquals(isValidRouteId('foo.bar'), false);
});

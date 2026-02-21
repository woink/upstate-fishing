import { describe, it } from '@std/testing/bdd';
import { assertEquals } from '@std/assert';
import { cn } from '@shared/lib/cn.ts';

describe('cn() class name utility', () => {
  it('joins multiple class strings', () => {
    assertEquals(cn('foo', 'bar'), 'foo bar');
  });

  it('filters out undefined values', () => {
    assertEquals(cn('foo', undefined, 'bar'), 'foo bar');
  });

  it('filters out null values', () => {
    assertEquals(cn('foo', null, 'bar'), 'foo bar');
  });

  it('filters out false values', () => {
    assertEquals(cn('foo', false, 'bar'), 'foo bar');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    assertEquals(
      cn('btn', isActive && 'btn-active', isDisabled && 'btn-disabled'),
      'btn btn-active',
    );
  });

  it('returns empty string for no truthy inputs', () => {
    assertEquals(cn(undefined, null, false), '');
  });

  it('handles single class', () => {
    assertEquals(cn('solo'), 'solo');
  });

  it('filters out empty string inputs', () => {
    assertEquals(cn('foo', '', 'bar'), 'foo bar');
  });
});

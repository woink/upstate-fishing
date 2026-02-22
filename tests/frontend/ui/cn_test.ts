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

  describe('Tailwind conflict resolution', () => {
    it('resolves background color conflicts (last wins)', () => {
      assertEquals(cn('bg-red-500', 'bg-blue-500'), 'bg-blue-500');
    });

    it('resolves padding conflicts', () => {
      assertEquals(cn('px-4', 'px-8'), 'px-8');
    });

    it('resolves text size conflicts', () => {
      assertEquals(cn('text-sm', 'text-lg'), 'text-lg');
    });

    it('preserves non-conflicting classes', () => {
      assertEquals(cn('bg-red-500', 'text-white', 'bg-blue-500'), 'text-white bg-blue-500');
    });

    it('resolves conflicts from conditional classes', () => {
      const override = true;
      assertEquals(
        cn('bg-red-500', override && 'bg-green-500'),
        'bg-green-500',
      );
    });

    it('resolves height conflicts', () => {
      assertEquals(cn('h-10', 'h-11'), 'h-11');
    });

    it('resolves border-radius conflicts', () => {
      assertEquals(cn('rounded-md', 'rounded-lg'), 'rounded-lg');
    });
  });
});

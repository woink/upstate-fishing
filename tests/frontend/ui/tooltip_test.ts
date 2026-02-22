import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import { Tooltip } from '../../../islands/ui/Tooltip.tsx';

describe('Tooltip island', () => {
  describe('exports', () => {
    it('exports Tooltip as a function component', () => {
      assertEquals(typeof Tooltip, 'function');
    });

    it('Tooltip function has correct name', () => {
      assertEquals(Tooltip.name, 'Tooltip');
    });
  });

  describe('source code conventions', () => {
    it('does not contain unused triggerRef', async () => {
      const src = await Deno.readTextFile('islands/ui/Tooltip.tsx');
      assert(
        !src.includes('triggerRef'),
        'triggerRef should be removed — it served no purpose',
      );
    });

    it('uses idRef for stable tooltip ID', async () => {
      const src = await Deno.readTextFile('islands/ui/Tooltip.tsx');
      assert(src.includes('idRef'), 'should use idRef for tooltip ID generation');
    });

    it('links trigger to tooltip via aria-describedby', async () => {
      const src = await Deno.readTextFile('islands/ui/Tooltip.tsx');
      assert(
        src.includes('aria-describedby'),
        'trigger span should have aria-describedby',
      );
      assert(
        src.includes('id={idRef.current}'),
        'tooltip span should have id from idRef',
      );
    });
  });
});

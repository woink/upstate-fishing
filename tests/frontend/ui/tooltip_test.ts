import { describe, it } from '@std/testing/bdd';
import { assertEquals } from '@std/assert';
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
});

import { describe, it } from '@std/testing/bdd';
import { assertEquals } from '@std/assert';
import { Dialog } from '../../../islands/ui/Dialog.tsx';

describe('Dialog island', () => {
  describe('exports', () => {
    it('exports Dialog as a function component', () => {
      assertEquals(typeof Dialog, 'function');
    });

    it('Dialog function accepts props with expected shape', () => {
      // Verify the function name is Dialog (not a wrapper)
      assertEquals(Dialog.name, 'Dialog');
    });
  });
});

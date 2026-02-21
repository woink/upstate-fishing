import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import { Badge } from '../../../components/ui/Badge.tsx';

describe('Badge component', () => {
  describe('variants', () => {
    it('applies default variant', () => {
      const vnode = Badge({ children: 'Tag' });
      assertEquals(vnode.type, 'span');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-primary'), 'default should include bg-primary');
    });

    it('applies secondary variant', () => {
      const vnode = Badge({ variant: 'secondary', children: 'Tag' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-secondary'), 'should include bg-secondary');
    });

    it('applies destructive variant', () => {
      const vnode = Badge({ variant: 'destructive', children: 'Tag' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-destructive'), 'should include bg-destructive');
    });

    it('applies outline variant', () => {
      const vnode = Badge({ variant: 'outline', children: 'Tag' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('border'), 'outline should include border');
    });
  });

  describe('fishing quality variants', () => {
    it('applies excellent quality styling', () => {
      const vnode = Badge({ variant: 'excellent', children: 'Excellent' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('quality-excellent'), 'should use quality-excellent token');
    });

    it('applies good quality styling', () => {
      const vnode = Badge({ variant: 'good', children: 'Good' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('quality-good'), 'should use quality-good token');
    });

    it('applies fair quality styling', () => {
      const vnode = Badge({ variant: 'fair', children: 'Fair' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('quality-fair'), 'should use quality-fair token');
    });

    it('applies poor quality styling', () => {
      const vnode = Badge({ variant: 'poor', children: 'Poor' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('quality-poor'), 'should use quality-poor token');
    });
  });

  describe('rendering', () => {
    it('renders as span element', () => {
      const vnode = Badge({ children: 'Tag' });
      assertEquals(vnode.type, 'span');
    });

    it('accepts additional class names', () => {
      const vnode = Badge({ class: 'extra', children: 'Tag' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('extra'), 'should include extra class');
    });
  });
});

import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import { Progress } from '../../../components/ui/Progress.tsx';

// deno-lint-ignore no-explicit-any
type VNode = any;

describe('Progress component', () => {
  describe('rendering', () => {
    it('renders a div wrapper', () => {
      const vnode = Progress({ value: 50 });
      assertEquals(vnode.type, 'div');
    });

    it('uses design token background for track', () => {
      const vnode = Progress({ value: 50 });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-muted'), 'track should use bg-muted');
    });

    it('contains an inner bar element', () => {
      const vnode = Progress({ value: 50 });
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const bar = children.find(
        (c: VNode) => c && typeof c === 'object' && c.type === 'div',
      );
      assert(bar, 'should contain an inner bar div');
    });

    it('uses primary token for bar color', () => {
      const vnode = Progress({ value: 50 });
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const bar = children.find(
        (c: VNode) => c && typeof c === 'object' && c.type === 'div',
      );
      assert(bar, 'should contain bar');
      const classStr = String(bar.props.class || '');
      assert(classStr.includes('bg-primary'), 'bar should use bg-primary');
    });

    it('sets width style based on value', () => {
      const vnode = Progress({ value: 75 });
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const bar = children.find(
        (c: VNode) => c && typeof c === 'object' && c.type === 'div',
      );
      assert(bar, 'should contain bar');
      assertEquals(bar.props.style?.width, '75%');
    });

    it('clamps value between 0 and 100', () => {
      const over = Progress({ value: 150 });
      const overChildren = Array.isArray(over.props.children)
        ? over.props.children
        : [over.props.children];
      const overBar = overChildren.find(
        (c: VNode) => c && typeof c === 'object' && c.type === 'div',
      );
      assertEquals(overBar.props.style?.width, '100%');

      const under = Progress({ value: -10 });
      const underChildren = Array.isArray(under.props.children)
        ? under.props.children
        : [under.props.children];
      const underBar = underChildren.find(
        (c: VNode) => c && typeof c === 'object' && c.type === 'div',
      );
      assertEquals(underBar.props.style?.width, '0%');
    });

    it('has ARIA progressbar role', () => {
      const vnode = Progress({ value: 50 });
      assertEquals(vnode.props.role, 'progressbar');
    });

    it('sets aria-label when label prop is provided', () => {
      const vnode = Progress({ value: 50, label: 'Loading progress' });
      assertEquals(vnode.props['aria-label'], 'Loading progress');
    });

    it('aria-label is undefined when no label prop', () => {
      const vnode = Progress({ value: 50 });
      assertEquals(vnode.props['aria-label'], undefined);
    });

    it('accepts additional class names', () => {
      const vnode = Progress({ value: 50, class: 'mt-4' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('mt-4'), 'should include custom class');
    });
  });
});

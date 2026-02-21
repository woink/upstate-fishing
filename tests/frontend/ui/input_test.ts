import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import { Input } from '../../../components/ui/Input.tsx';

// deno-lint-ignore no-explicit-any
type VNode = any;

describe('Input component', () => {
  describe('rendering', () => {
    it('renders with wrapper div containing an input', () => {
      const vnode = Input({});
      assertEquals(vnode.type, 'div');
      const children = vnode.props.children;
      assert(children !== undefined, 'should have children');
    });

    it('applies design token classes to the input', () => {
      const vnode = Input({});
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const inputChild = children.find(
        (c: VNode) => c && typeof c === 'object' && c.type === 'input',
      );
      assert(inputChild, 'should contain an input element');
      const classStr = String(inputChild.props.class || '');
      assert(classStr.includes('border-input'), 'should include border-input');
      assert(classStr.includes('bg-background'), 'should include bg-background');
    });

    it('renders label when provided', () => {
      const vnode = Input({ label: 'Email' });
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const label = children.find(
        (c: VNode) => c && typeof c === 'object' && c.type === 'label',
      );
      assert(label, 'should render a label element');
    });

    it('renders helper text when provided', () => {
      const vnode = Input({ helperText: 'Enter your email' });
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const helper = children.find(
        (c: VNode) =>
          c && typeof c === 'object' && c.type === 'p' &&
          String(c.props.class || '').includes('text-muted-foreground'),
      );
      assert(helper, 'should render helper text');
    });

    it('renders error state', () => {
      const vnode = Input({ error: 'Required field' });
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const errorEl = children.find(
        (c: VNode) =>
          c && typeof c === 'object' && c.type === 'p' &&
          String(c.props.class || '').includes('text-destructive'),
      );
      assert(errorEl, 'should render error text with destructive color');
    });

    it('accepts additional class names', () => {
      const vnode = Input({ class: 'custom-input' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('custom-input'), 'should include custom class on wrapper');
    });
  });
});

import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import { Button, type ButtonProps } from '../../../components/ui/Button.tsx';

describe('Button component', () => {
  describe('variant classes', () => {
    it('applies primary variant by default', () => {
      const props: ButtonProps = { children: 'Click' };
      const vnode = Button(props);
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-primary'), 'should include bg-primary');
      assert(
        classStr.includes('text-primary-foreground'),
        'should include text-primary-foreground',
      );
    });

    it('applies secondary variant', () => {
      const vnode = Button({ variant: 'secondary', children: 'Click' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-secondary'), 'should include bg-secondary');
    });

    it('applies outline variant', () => {
      const vnode = Button({ variant: 'outline', children: 'Click' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('border'), 'should include border');
      assert(classStr.includes('bg-background'), 'should include bg-background');
    });

    it('applies ghost variant', () => {
      const vnode = Button({ variant: 'ghost', children: 'Click' });
      const classStr = String(vnode.props.class || '');
      assert(
        classStr.includes('hover:bg-accent') || classStr.includes('bg-transparent'),
        'ghost should have transparent or hover:bg-accent',
      );
    });

    it('applies destructive variant', () => {
      const vnode = Button({ variant: 'destructive', children: 'Click' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-destructive'), 'should include bg-destructive');
    });
  });

  describe('size classes', () => {
    it('applies md size by default', () => {
      const vnode = Button({ children: 'Click' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('h-10'), 'default md should include h-10');
    });

    it('applies sm size', () => {
      const vnode = Button({ size: 'sm', children: 'Click' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('h-9'), 'sm should include h-9');
    });

    it('applies lg size', () => {
      const vnode = Button({ size: 'lg', children: 'Click' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('h-11'), 'lg should include h-11');
    });
  });

  describe('rendering', () => {
    it('renders as button element by default', () => {
      const vnode = Button({ children: 'Click' });
      assertEquals(vnode.type, 'button');
    });

    it('renders as anchor when href is provided', () => {
      const vnode = Button({ href: '/test', children: 'Link' });
      assertEquals(vnode.type, 'a');
      assertEquals(vnode.props.href, '/test');
    });

    it('passes through additional class names', () => {
      const vnode = Button({ class: 'extra-class', children: 'Click' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('extra-class'), 'should include extra-class');
    });

    it('passes disabled prop to button element', () => {
      const vnode = Button({ disabled: true, children: 'Click' });
      assertEquals(vnode.props.disabled, true);
    });

    it('passes type prop to button element', () => {
      const vnode = Button({ type: 'submit', children: 'Submit' });
      assertEquals(vnode.props.type, 'submit');
    });

    it('renders button type by default', () => {
      const vnode = Button({ children: 'Click' });
      assertEquals(vnode.props.type, 'button');
    });

    it('passes onClick to button element', () => {
      let clicked = false;
      const vnode = Button({ onClick: () => clicked = true, children: 'Click' });
      vnode.props.onClick();
      assert(clicked, 'onClick should have been called');
    });

    it('passes onClick to anchor element', () => {
      let clicked = false;
      const vnode = Button({ href: '/test', onClick: () => clicked = true, children: 'Link' });
      vnode.props.onClick();
      assert(clicked, 'onClick should have been called on anchor');
    });
  });
});

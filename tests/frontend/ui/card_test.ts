import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card.tsx';

describe('Card components', () => {
  describe('Card', () => {
    it('renders a div with card token classes', () => {
      const vnode = Card({ children: 'content' });
      assertEquals(vnode.type, 'div');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-card'), 'should include bg-card');
      assert(classStr.includes('text-card-foreground'), 'should include text-card-foreground');
      assert(classStr.includes('rounded'), 'should include rounded border radius');
    });

    it('accepts additional class names', () => {
      const vnode = Card({ class: 'custom', children: 'content' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('custom'), 'should include custom class');
    });
  });

  describe('CardHeader', () => {
    it('renders with flex and spacing', () => {
      const vnode = CardHeader({ children: 'header' });
      assertEquals(vnode.type, 'div');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('flex'), 'should include flex');
      assert(classStr.includes('p-6'), 'should include padding');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 heading', () => {
      const vnode = CardTitle({ children: 'title' });
      assertEquals(vnode.type, 'h3');
    });
  });

  describe('CardDescription', () => {
    it('renders with muted-foreground color', () => {
      const vnode = CardDescription({ children: 'desc' });
      assertEquals(vnode.type, 'p');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('text-muted-foreground'), 'should use muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders with padding', () => {
      const vnode = CardContent({ children: 'body' });
      assertEquals(vnode.type, 'div');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('p-6'), 'should include padding');
    });
  });

  describe('CardFooter', () => {
    it('renders with border-top and padding', () => {
      const vnode = CardFooter({ children: 'footer' });
      assertEquals(vnode.type, 'div');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('p-6'), 'should include padding');
    });
  });
});

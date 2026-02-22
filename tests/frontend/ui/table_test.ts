import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/Table.tsx';

describe('Table components', () => {
  describe('Table', () => {
    it('renders a table element', () => {
      const vnode = Table({ children: null });
      assertEquals(vnode.type, 'div');
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const table = children.find(
        // deno-lint-ignore no-explicit-any
        (c: any) => c && typeof c === 'object' && c.type === 'table',
      );
      assert(table, 'should contain a table element');
    });

    it('has responsive wrapper', () => {
      const vnode = Table({ children: null });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('overflow'), 'wrapper should handle overflow');
    });
  });

  describe('TableHeader', () => {
    it('renders thead element', () => {
      const vnode = TableHeader({ children: null });
      assertEquals(vnode.type, 'thead');
    });
  });

  describe('TableBody', () => {
    it('renders tbody element', () => {
      const vnode = TableBody({ children: null });
      assertEquals(vnode.type, 'tbody');
    });
  });

  describe('TableRow', () => {
    it('renders tr element with border', () => {
      const vnode = TableRow({ children: null });
      assertEquals(vnode.type, 'tr');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('border'), 'should have border');
    });
  });

  describe('TableHead', () => {
    it('renders th element with muted-foreground', () => {
      const vnode = TableHead({ children: null });
      assertEquals(vnode.type, 'th');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('text-muted-foreground'), 'should use muted-foreground');
    });
  });

  describe('TableCell', () => {
    it('renders td element with padding', () => {
      const vnode = TableCell({ children: null });
      assertEquals(vnode.type, 'td');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('p-'), 'should have padding');
    });
  });
});

import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import {
  Skeleton,
  SkeletonCircle,
  SkeletonHeading,
  SkeletonText,
  StreamConditionsSkeleton,
  StreamListItemSkeleton,
  TopPicksSkeleton,
} from '../../../components/ui/Skeleton.tsx';

describe('Skeleton components', () => {
  describe('Skeleton', () => {
    it('renders a div with animate-pulse', () => {
      const vnode = Skeleton({});
      assertEquals(vnode.type, 'div');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('animate-pulse'), 'should have animate-pulse');
    });

    it('uses design token background color', () => {
      const vnode = Skeleton({});
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-muted'), 'should use bg-muted token');
    });

    it('accepts additional class names', () => {
      const vnode = Skeleton({ class: 'h-4 w-20' });
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('h-4'), 'should include custom height');
      assert(classStr.includes('w-20'), 'should include custom width');
    });
  });

  describe('SkeletonText', () => {
    it('renders with h-4 height', () => {
      const vnode = SkeletonText({});
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('h-4'), 'should have h-4 height');
    });
  });

  describe('SkeletonHeading', () => {
    it('renders with h-6 height', () => {
      const vnode = SkeletonHeading({});
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('h-6'), 'should have h-6 height');
    });
  });

  describe('SkeletonCircle', () => {
    it('renders with rounded-full', () => {
      const vnode = SkeletonCircle({});
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('rounded-full'), 'should be fully rounded');
    });
  });

  describe('composite skeletons', () => {
    it('TopPicksSkeleton renders a card skeleton', () => {
      const vnode = TopPicksSkeleton();
      assertEquals(vnode.type, 'div');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-card'), 'should use bg-card token');
    });

    it('StreamListItemSkeleton renders a card skeleton', () => {
      const vnode = StreamListItemSkeleton();
      assertEquals(vnode.type, 'div');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-card'), 'should use bg-card token');
    });

    it('StreamConditionsSkeleton renders with sections', () => {
      const vnode = StreamConditionsSkeleton();
      assertEquals(vnode.type, 'div');
      const classStr = String(vnode.props.class || '');
      assert(classStr.includes('bg-card'), 'should use bg-card token');
    });
  });
});

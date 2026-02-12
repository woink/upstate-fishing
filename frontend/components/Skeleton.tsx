/**
 * Skeleton Loading Components
 *
 * Provides placeholder UI while content is loading.
 * Uses pulse animation for a polished loading experience.
 */

interface SkeletonProps {
  class?: string;
}

/**
 * Basic skeleton rectangle
 */
export function Skeleton({ class: className = '' }: SkeletonProps) {
  return (
    <div
      class={`animate-pulse bg-slate-200 rounded ${className}`}
    />
  );
}

/**
 * Skeleton for a text line
 */
export function SkeletonText({ class: className = '' }: SkeletonProps) {
  return <Skeleton class={`h-4 ${className}`} />;
}

/**
 * Skeleton for a heading
 */
export function SkeletonHeading({ class: className = '' }: SkeletonProps) {
  return <Skeleton class={`h-6 ${className}`} />;
}

/**
 * Skeleton for a circular avatar/icon
 */
export function SkeletonCircle({ class: className = '' }: SkeletonProps) {
  return <Skeleton class={`rounded-full ${className}`} />;
}

/**
 * Skeleton for TopPicks stream card
 */
export function TopPicksSkeleton() {
  return (
    <div class='bg-white rounded-lg border-l-4 border-slate-300 p-4 shadow'>
      <div class='flex items-start justify-between mb-2'>
        <SkeletonHeading class='w-32' />
        <SkeletonCircle class='w-6 h-6' />
      </div>
      <div class='space-y-2 mb-3'>
        <SkeletonText class='w-24' />
        <SkeletonText class='w-20' />
        <SkeletonText class='w-28' />
      </div>
      <SkeletonText class='w-36' />
      <div class='mt-2'>
        <Skeleton class='h-5 w-20' />
      </div>
    </div>
  );
}

/**
 * Skeleton for stream list item
 */
export function StreamListItemSkeleton() {
  return (
    <div class='bg-white rounded-lg border-l-4 border-slate-300 p-4 shadow'>
      <div class='flex items-start justify-between'>
        <div class='flex-1'>
          <SkeletonHeading class='w-40 mb-2' />
          <SkeletonText class='w-24' />
        </div>
        <Skeleton class='h-6 w-16 rounded' />
      </div>
      <div class='mt-3 grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div>
          <SkeletonText class='w-12 mb-1' />
          <Skeleton class='h-5 w-16' />
        </div>
        <div>
          <SkeletonText class='w-12 mb-1' />
          <Skeleton class='h-5 w-16' />
        </div>
        <div>
          <SkeletonText class='w-12 mb-1' />
          <Skeleton class='h-5 w-20' />
        </div>
        <div>
          <SkeletonText class='w-12 mb-1' />
          <Skeleton class='h-5 w-24' />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for stream conditions card
 */
export function StreamConditionsSkeleton() {
  return (
    <div class='bg-white rounded-lg border-l-4 border-slate-300 shadow-lg'>
      {/* Header */}
      <div class='p-6 border-b border-slate-200'>
        <div class='flex items-start justify-between'>
          <div>
            <SkeletonHeading class='w-48 mb-2' />
            <SkeletonText class='w-32' />
          </div>
          <SkeletonCircle class='w-10 h-10' />
        </div>
        <div class='mt-4'>
          <Skeleton class='h-6 w-36 mb-2' />
          <SkeletonText class='w-full' />
          <SkeletonText class='w-3/4 mt-1' />
        </div>
      </div>

      {/* Current Data */}
      <div class='p-6'>
        <SkeletonHeading class='w-32 mb-4' />
        <div class='grid md:grid-cols-2 gap-6'>
          {/* Water Data */}
          <div class='space-y-3'>
            <Skeleton class='h-5 w-28' />
            <div class='bg-slate-50 rounded p-3'>
              <SkeletonText class='w-32 mb-2' />
              <div class='grid grid-cols-3 gap-2'>
                <div>
                  <SkeletonText class='w-10 mb-1' />
                  <Skeleton class='h-5 w-12' />
                </div>
                <div>
                  <SkeletonText class='w-10 mb-1' />
                  <Skeleton class='h-5 w-14' />
                </div>
                <div>
                  <SkeletonText class='w-10 mb-1' />
                  <Skeleton class='h-5 w-12' />
                </div>
              </div>
            </div>
          </div>

          {/* Weather */}
          <div class='space-y-3'>
            <Skeleton class='h-5 w-24' />
            <div class='bg-slate-50 rounded p-3'>
              <Skeleton class='h-5 w-40 mb-2' />
              <div class='grid grid-cols-2 gap-2'>
                <SkeletonText class='w-20' />
                <SkeletonText class='w-16' />
                <SkeletonText class='w-24' />
                <SkeletonText class='w-16' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div class='p-4 bg-slate-100 rounded-b-lg'>
        <SkeletonText class='w-40' />
      </div>
    </div>
  );
}

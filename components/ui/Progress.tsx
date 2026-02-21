import { cn } from '@shared/lib/cn.ts';

interface ProgressProps {
  value: number;
  class?: string;
}

export function Progress({ value, class: className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role='progressbar'
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      class={cn('relative h-4 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        class='h-full bg-primary transition-all'
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { cn } from '@shared/lib/cn.ts';

interface TooltipProps {
  content: string;
  class?: string;
  children: ComponentChildren;
}

export function Tooltip({
  content,
  class: className,
  children,
}: TooltipProps) {
  const visible = useSignal(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={triggerRef}
      class={cn('relative inline-block', className)}
      onMouseEnter={() => {
        visible.value = true;
      }}
      onMouseLeave={() => {
        visible.value = false;
      }}
      onFocus={() => {
        visible.value = true;
      }}
      onBlur={() => {
        visible.value = false;
      }}
    >
      {children}
      {visible.value && (
        <span
          role='tooltip'
          class={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5',
            'rounded-md bg-popover text-popover-foreground text-sm shadow-md border border-border',
            'whitespace-nowrap z-50',
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}

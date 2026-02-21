import type { ComponentChildren } from 'preact';
import { cn } from '@shared/lib/cn.ts';

const variantClasses = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border border-border text-foreground bg-transparent',
  excellent: 'bg-quality-excellent text-white',
  good: 'bg-quality-good text-white',
  fair: 'bg-quality-fair text-white',
  poor: 'bg-quality-poor text-white',
} as const;

export type BadgeVariant = keyof typeof variantClasses;

export interface BadgeProps {
  variant?: BadgeVariant;
  class?: string;
  children: ComponentChildren;
}

export function Badge({
  variant = 'default',
  class: className,
  children,
}: BadgeProps) {
  return (
    <span
      class={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

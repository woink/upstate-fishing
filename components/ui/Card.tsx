import type { ComponentChildren } from 'preact';
import { cn } from '@shared/lib/cn.ts';

interface CardComponentProps {
  class?: string;
  children: ComponentChildren;
}

export function Card({ class: className, children }: CardComponentProps) {
  return (
    <div
      class={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ class: className, children }: CardComponentProps) {
  return (
    <div class={cn('flex flex-col space-y-1.5 p-6', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ class: className, children }: CardComponentProps) {
  return (
    <h3 class={cn('text-2xl font-semibold leading-none tracking-tight', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ class: className, children }: CardComponentProps) {
  return (
    <p class={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
}

export function CardContent({ class: className, children }: CardComponentProps) {
  return (
    <div class={cn('p-6 pt-0', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ class: className, children }: CardComponentProps) {
  return (
    <div class={cn('flex items-center p-6 pt-0', className)}>
      {children}
    </div>
  );
}

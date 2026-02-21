import type { ComponentChildren } from 'preact';
import { cn } from '@shared/lib/cn.ts';

interface TableComponentProps {
  class?: string;
  children: ComponentChildren;
}

export function Table({ class: className, children }: TableComponentProps) {
  return (
    <div class={cn('relative w-full overflow-auto', className)}>
      <table class='w-full caption-bottom text-sm'>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ class: className, children }: TableComponentProps) {
  return (
    <thead class={cn('[&_tr]:border-b', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ class: className, children }: TableComponentProps) {
  return (
    <tbody class={cn('[&_tr:last-child]:border-0', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ class: className, children }: TableComponentProps) {
  return (
    <tr
      class={cn(
        'border-b border-border transition-colors hover:bg-muted/50',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ class: className, children }: TableComponentProps) {
  return (
    <th
      class={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ class: className, children }: TableComponentProps) {
  return (
    <td class={cn('p-4 align-middle', className)}>
      {children}
    </td>
  );
}

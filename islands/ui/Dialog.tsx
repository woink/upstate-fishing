import type { ComponentChildren } from 'preact';
import type { Signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { cn } from '@shared/lib/cn.ts';

export interface DialogProps {
  open: Signal<boolean>;
  onClose: () => void;
  title?: string;
  class?: string;
  children: ComponentChildren;
}

export function Dialog({
  open,
  onClose,
  title,
  class: className,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open.value) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus trap: focus the dialog on open
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open.value, onClose]);

  if (!open.value) return null;

  return (
    <div class='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Overlay */}
      <div
        class='fixed inset-0 bg-background/80 backdrop-blur-sm'
        onClick={onClose}
      />
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-label={title}
        tabIndex={-1}
        class={cn(
          'relative z-50 w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg',
          'focus:outline-none',
          className,
        )}
      >
        {title && (
          <h2 class='text-lg font-semibold leading-none tracking-tight mb-4'>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

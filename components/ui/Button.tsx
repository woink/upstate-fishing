import type { ComponentChildren } from 'preact';
import { cn } from '@shared/lib/cn.ts';

const variantClasses = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
} as const;

const sizeClasses = {
  sm: 'h-9 px-3 text-sm rounded-md',
  md: 'h-10 px-4 py-2 rounded-md',
  lg: 'h-11 px-8 text-lg rounded-md',
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  class?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
  children: ComponentChildren;
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  class: className,
  type = 'button',
  disabled,
  onClick,
  children,
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <a href={href} class={classes} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} class={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

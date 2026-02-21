import { cn } from '@shared/lib/cn.ts';

export interface InputProps {
  type?: 'text' | 'search' | 'email' | 'password' | 'number' | 'tel' | 'url';
  name?: string;
  id?: string;
  placeholder?: string;
  value?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  class?: string;
}

export function Input({
  type = 'text',
  name,
  id,
  placeholder,
  value,
  label,
  helperText,
  error,
  disabled,
  required,
  class: className,
}: InputProps) {
  const inputId = id || name;

  return (
    <div class={cn('space-y-1', className)}>
      {label && (
        <label
          for={inputId}
          class='text-sm font-medium leading-none text-foreground'
        >
          {label}
          {required && <span class='text-destructive ml-1'>*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        id={inputId}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        required={required}
        class={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
        )}
      />
      {helperText && !error && <p class='text-sm text-muted-foreground'>{helperText}</p>}
      {error && <p class='text-sm text-destructive'>{error}</p>}
    </div>
  );
}

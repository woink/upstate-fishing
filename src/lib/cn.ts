import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind conflict resolution.
 * Filters falsy values, then uses tailwind-merge to deduplicate
 * conflicting utilities (e.g., bg-red-500 + bg-blue-500 → bg-blue-500).
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(inputs.filter(Boolean).join(' '));
}

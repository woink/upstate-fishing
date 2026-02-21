/**
 * Simple class name merge utility.
 * Joins truthy class name strings, filtering out undefined/null/false.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

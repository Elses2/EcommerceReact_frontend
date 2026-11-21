/**
 * Merges class names conditionally, filtering out falsy values.
 * A lightweight utility for conditional CSS class composition.
 * @param classes - Array of class names or falsy values to join
 * @returns A single string of space-separated class names
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

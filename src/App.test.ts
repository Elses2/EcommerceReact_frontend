import { describe, it, expect } from 'vitest';
import { cn } from './lib/utils';

describe('cn', () => {
  it('joins class names and filters falsy values', () => {
    expect(cn('foo', 'bar', false, undefined, null)).toBe('foo bar');
  });

  it('returns empty string for all falsy inputs', () => {
    expect(cn(false, undefined, null)).toBe('');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { BadgeCounter } from './BadgeCounter';

describe('BadgeCounter atom (spec §3, atoms/badge-counter.ejs)', () => {
  it('renders with count=0 by default', () => {
    render(<BadgeCounter />);
    const badge = screen.getByText('0');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-cart-count', '0');
  });

  it('renders with a positive count', () => {
    render(<BadgeCounter count={3} />);
    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-cart-count', '3');
  });

  it('preserves the data-cart-count attribute verbatim', () => {
    render(<BadgeCounter count={7} />);
    expect(getByAttribute('data-cart-count', '7')).toBeInTheDocument();
  });

  it('renders 0 when given a negative count', () => {
    render(<BadgeCounter count={-1} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(getByAttribute('data-cart-count', '0')).toBeInTheDocument();
  });
});

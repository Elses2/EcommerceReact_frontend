import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { CartIcon } from './CartIcon';

describe('CartIcon molecule (spec §3, molecules/cart-icon.ejs)', () => {
  it('renders a cart link with aria-label', () => {
    render(<CartIcon />);
    expect(screen.getByRole('link', { name: /carrito de compras, 0 productos/i })).toBeInTheDocument();
  });

  it('preserves data-cart-count on the BadgeCounter', () => {
    render(<CartIcon count={5} />);
    expect(getByAttribute('data-cart-count', '5')).toBeInTheDocument();
  });

  it('uses the href prop for the cart link', () => {
    render(<CartIcon href="/custom-cart" />);
    expect(screen.getByRole('link', { name: /carrito/i })).toHaveAttribute('href', '/custom-cart');
  });

  it('renders singular "producto" for count=1', () => {
    render(<CartIcon count={1} />);
    expect(screen.getByRole('link', { name: /carrito de compras, 1 producto/i })).toBeInTheDocument();
  });
});

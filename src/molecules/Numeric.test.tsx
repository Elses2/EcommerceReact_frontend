import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { Numeric } from './Numeric';

describe('Numeric molecule (spec §3, molecules/numeric.ejs)', () => {
  it('renders with productId and quantity', () => {
    render(<Numeric productId={42} quantity={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('preserves data-quantity attribute on the span', () => {
    render(<Numeric productId={42} quantity={5} />);
    expect(getByAttribute('data-quantity')).toBeInTheDocument();
  });

  it('preserves data-cart-action and data-product-id on decrease button', () => {
    render(<Numeric productId={42} quantity={3} />);
    const decreaseBtn = screen.getByRole('button', { name: 'Reducir cantidad' });
    expect(decreaseBtn).toHaveAttribute('data-cart-action', 'decrease');
    expect(decreaseBtn).toHaveAttribute('data-product-id', '42');
  });

  it('preserves data-cart-action and data-product-id on increase button', () => {
    render(<Numeric productId={42} quantity={3} />);
    const increaseBtn = screen.getByRole('button', { name: 'Aumentar cantidad' });
    expect(increaseBtn).toHaveAttribute('data-cart-action', 'increase');
    expect(increaseBtn).toHaveAttribute('data-product-id', '42');
  });

  it('calls onDecrease when the − button is clicked', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const onDecrease = vi.fn();
    render(<Numeric productId={1} quantity={2} onDecrease={onDecrease} />);
    await user.click(screen.getByRole('button', { name: 'Reducir cantidad' }));
    expect(onDecrease).toHaveBeenCalledOnce();
  });

  it('calls onIncrease when the + button is clicked', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const onIncrease = vi.fn();
    render(<Numeric productId={1} quantity={2} onIncrease={onIncrease} />);
    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
    expect(onIncrease).toHaveBeenCalledOnce();
  });
});

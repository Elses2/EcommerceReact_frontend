import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { Product } from './Product';

describe('Product molecule (spec §3, molecules/product.ejs)', () => {
  const product = {
    id: 1,
    name: 'Teclado Mecánico',
    price: 15000,
    imageUrl: '/images/keyboard.jpg',
    inStock: true,
    categories: [{ id: 1, name: 'Periféricos' }],
  };

  it('renders the product card with image, name, and price', () => {
    render(<Product product={product} />);
    expect(screen.getByRole('img', { name: 'Teclado Mecánico' })).toBeInTheDocument();
    expect(screen.getByText('Teclado Mecánico')).toBeInTheDocument();
    expect(screen.getByText('15.000')).toBeInTheDocument();
  });

  it('preserves data-product-id on the article root', () => {
    render(<Product product={product} />);
    expect(getByAttribute('data-product-id', '1')).toBeInTheDocument();
  });

  it('preserves data-cart-action="add" and data-product-id on the button', () => {
    render(<Product product={product} />);
    const btn = screen.getByRole('button', { name: 'Agregar al carrito' });
    expect(btn).toHaveAttribute('data-cart-action', 'add');
    expect(btn).toHaveAttribute('data-product-id', '1');
  });

  it('calls onAddToCart when the button is clicked', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const onAddToCart = vi.fn();
    render(<Product product={product} onAddToCart={onAddToCart} />);
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }));
    expect(onAddToCart).toHaveBeenCalledWith(1);
  });

  it('renders "Sin stock" badge and disables button when out of stock', () => {
    const outOfStock = { ...product, inStock: false };
    render(<Product product={outOfStock} />);
    expect(screen.getByText('Sin stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar al carrito' })).toBeDisabled();
  });

  it('does not call onAddToCart when the button is disabled', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const onAddToCart = vi.fn();
    const outOfStock = { ...product, inStock: false };
    render(<Product product={outOfStock} onAddToCart={onAddToCart} />);
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }));
    expect(onAddToCart).not.toHaveBeenCalled();
  });

  it('uses the fallback image when the main image fails to load', () => {
    render(<Product product={product} fallbackImageUrl="/fallback.png" />);
    const img = screen.getByRole('img', { name: 'Teclado Mecánico' });
    img.dispatchEvent(new Event('error'));
    expect(img).toHaveAttribute('src', '/fallback.png');
  });
});

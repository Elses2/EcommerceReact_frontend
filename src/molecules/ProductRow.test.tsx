import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductRow } from './ProductRow';

describe('ProductRow molecule (spec §3, molecules/product-row.ejs)', () => {
  const product = {
    id: 1,
    name: 'Teclado Mecánico',
    imageUrl: '/images/keyboard.jpg',
  };

  it('renders a link with the product image and name', () => {
    render(<ProductRow product={product} />);
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Teclado Mecánico' })).toBeInTheDocument();
    expect(screen.getByText('Teclado Mecánico')).toBeInTheDocument();
  });

  it('renders the product id as a muted text', () => {
    render(<ProductRow product={product} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('uses the fallback image when the main image fails to load', () => {
    render(<ProductRow product={product} fallbackImageUrl="/fallback.png" />);
    const img = screen.getByRole('img', { name: 'Teclado Mecánico' });
    img.dispatchEvent(new Event('error'));
    expect(img).toHaveAttribute('src', '/fallback.png');
  });

  it('uses href="#" by default', () => {
    render(<ProductRow product={product} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#');
  });

  it('uses a custom href when provided', () => {
    render(<ProductRow product={product} href="/products/1" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/1');
  });
});

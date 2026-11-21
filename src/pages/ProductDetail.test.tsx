/**
 * Unit tests for the ProductDetail page (`src/pages/ProductDetail.tsx`).
 *
 * Mocks the API client (`../lib/api`) and `useCart`
 * (`../providers/CartProvider`) — no network calls in tests.
 * Uses `getByAttribute` from `../test-helpers` for data-*
 * attribute queries per the existing test conventions.
 *
 * @spec (spec §6.8, §6.9, §6.10, §5)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { ProductDetail } from './ProductDetail';
import { api } from '../lib/api';
import { useCart } from '../providers/CartProvider';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('../providers/CartProvider', () => ({
  useCart: vi.fn(),
}));

const mockApiGet = vi.mocked(api.get);
const mockUseCart = vi.mocked(useCart);

beforeEach(() => {
  vi.clearAllMocks();
});

const mockProduct = {
  id: 1,
  name: 'Teclado Mecánico',
  price: 15000,
  imageUrl: '/images/keyboard.jpg',
  inStock: true,
  categories: [{ id: 1, name: 'Periféricos' }],
  description: 'Un teclado mecánico excelente.',
};

const mockRelated = [
  {
    id: 2,
    name: 'Mouse Óptico',
    price: 8999,
    imageUrl: '/images/mouse.jpg',
    inStock: true,
    categories: [{ id: 1, name: 'Periféricos' }],
  },
];

const mockProductDetailView = {
  product: mockProduct,
  related: mockRelated,
};

function setupCart(addFn = vi.fn()) {
  mockUseCart.mockReturnValue({
    cart: { items: [], total: 0, count: 0 },
    status: 'ready' as const,
    add: addFn,
    increase: vi.fn(),
    decrease: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  });
}

function renderWithRouter(ui: Parameters<typeof render>[0], initialEntries = ['/products/1']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/products/:id" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ProductDetail — renders product detail (spec §6.8)', () => {
  it('renders the product name, price, and description', async () => {
    mockApiGet.mockResolvedValue(mockProductDetailView);
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');
    expect(screen.getByText('Teclado Mecánico')).toBeInTheDocument();
    expect(screen.getByText('15.000')).toBeInTheDocument();
    expect(screen.getByText('Un teclado mecánico excelente.')).toBeInTheDocument();
  });

  it('renders the product image with correct src and alt', async () => {
    mockApiGet.mockResolvedValue(mockProductDetailView);
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');
    const img = screen.getByRole('img', { name: 'Teclado Mecánico' });
    expect(img).toHaveAttribute('src', '/images/keyboard.jpg');
  });

  it('renders the breadcrumb with back link and category', async () => {
    mockApiGet.mockResolvedValue(mockProductDetailView);
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');
    expect(screen.getByRole('link', { name: '← Volver al listado' })).toBeInTheDocument();
  });

  it('renders categories as badges', async () => {
    mockApiGet.mockResolvedValue(mockProductDetailView);
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');
    // Badge is rendered in the categories list
    const badge = screen.getAllByText('Periféricos');
    expect(badge.length).toBeGreaterThanOrEqual(1);
  });

  it('renders related products section with data-product-id', async () => {
    mockApiGet.mockResolvedValue(mockProductDetailView);
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');
    expect(
      screen.getByRole('heading', { name: 'Productos relacionados' }),
    ).toBeInTheDocument();
    expect(getByAttribute('data-product-id', '2')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Stock indicator
// ---------------------------------------------------------------------------

describe('ProductDetail — stock indicator (spec §6.10)', () => {
  it('renders "Sin stock" badge and disables button when out of stock', async () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    mockApiGet.mockResolvedValue({
      product: outOfStockProduct,
      related: [],
    });
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');
    expect(screen.getByText('Sin stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar al carrito' })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Add wiring
// ---------------------------------------------------------------------------

describe('ProductDetail — add button calls CartProvider.add (spec §5)', () => {
  it('calls add with the right productId when the add button is clicked', async () => {
    const addFn = vi.fn();
    setupCart(addFn);
    mockApiGet.mockResolvedValue(mockProductDetailView);

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');

    // El detalle y las cards de "Productos relacionados" comparten el nombre
    // accesible del botón: se selecciona el del detalle por su data-product-id.
    const addBtn = getByAttribute('data-product-id', '1');

    await act(async () => {
      addBtn.click();
    });

    expect(addFn).toHaveBeenCalledWith(1);
  });

  it('preserves data-cart-action="add" and data-product-id on the button', async () => {
    mockApiGet.mockResolvedValue(mockProductDetailView);
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');
    const buttons = screen.getAllByRole('button', { name: 'Agregar al carrito' });
    const addBtn = buttons.find(
      (btn) => btn.getAttribute('data-product-id') === '1',
    ) as HTMLButtonElement;
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveAttribute('data-cart-action', 'add');
    expect(addBtn).toHaveAttribute('data-product-id', '1');
  });
});

// ---------------------------------------------------------------------------
// Error states
// ---------------------------------------------------------------------------

describe('ProductDetail — error states (spec §6.9, §26.3)', () => {
  it('renders error message when API call fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Error al cargar el producto');
    expect(screen.getByText('Error al cargar el producto')).toBeInTheDocument();
  });

  it('renders not-found UI when API returns 404', async () => {
    const notFoundError = new Error('Not found') as Error & { status: number };
    notFoundError.status = 404;
    mockApiGet.mockRejectedValue(notFoundError);
    setupCart();

    renderWithRouter(<ProductDetail />, ['/products/999']);

    await screen.findByText('Producto no encontrado');
    expect(screen.getByText('Producto no encontrado')).toBeInTheDocument();
  });

  it('renders error for non-numeric productId (spec §6.9)', async () => {
    mockApiGet.mockResolvedValue(mockProductDetailView);
    setupCart();

    renderWithRouter(<ProductDetail />, ['/products/abc']);

    await screen.findByText('Producto no válido');
    expect(screen.getByText('Producto no válido')).toBeInTheDocument();
    expect(mockApiGet).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Empty related
// ---------------------------------------------------------------------------

describe('ProductDetail — empty related products', () => {
  it('renders the empty message when related array is empty', async () => {
    mockApiGet.mockResolvedValue({
      product: mockProduct,
      related: [],
    });
    setupCart();

    renderWithRouter(<ProductDetail />);

    await screen.findByText('Teclado Mecánico');
    expect(
      screen.getByText('No hay productos relacionados por ahora.'),
    ).toBeInTheDocument();
  });
});

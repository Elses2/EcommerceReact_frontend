/**
 * Unit tests for the Category page (`src/pages/Category.tsx`).
 *
 * Mocks the API client (`../lib/api`) and `useCart`
 * (`../providers/CartProvider`) — no network calls in tests.
 * Uses `getByAttribute` from `../test-helpers` for data-*
 * attribute queries per the existing test conventions.
 *
 * @spec (spec §4.6, §5, §6.8, §6.9, §25)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { Category } from './Category';
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

const mockProducts = [
  {
    id: 1,
    name: 'Teclado Mecánico',
    price: 15000,
    imageUrl: '/images/keyboard.jpg',
    inStock: true,
    categories: [{ id: 1, name: 'Periféricos' }],
  },
  {
    id: 2,
    name: 'Mouse Óptico',
    price: 8999,
    imageUrl: '/images/mouse.jpg',
    inStock: true,
    categories: [{ id: 1, name: 'Periféricos' }],
  },
];

const mockCategoryView = {
  category: { id: 1, name: 'Periféricos', description: 'Accesorios' },
  products: mockProducts,
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

function renderWithRouter(ui: Parameters<typeof render>[0], initialEntries = ['/categories/1']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/categories/:categoryId" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Category — renders category page with products (spec §4.6)', () => {
  it('renders the category heading with the category name', async () => {
    mockApiGet.mockResolvedValue(mockCategoryView);
    setupCart();

    renderWithRouter(<Category />);

    await screen.findByRole('heading', { name: 'Periféricos' });
    expect(screen.getByRole('heading', { name: 'Periféricos' })).toBeInTheDocument();
  });

  it('renders the breadcrumb with Inicio and category name', async () => {
    mockApiGet.mockResolvedValue(mockCategoryView);
    setupCart();

    renderWithRouter(<Category />);

    await screen.findByRole('heading', { name: 'Periféricos' });
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Periféricos' })).toBeInTheDocument();
  });

  it('renders product cards with data-product-id', async () => {
    mockApiGet.mockResolvedValue(mockCategoryView);
    setupCart();

    renderWithRouter(<Category />);

    await screen.findByText('Teclado Mecánico');
    expect(getByAttribute('data-product-id', '1')).toBeInTheDocument();
    expect(getByAttribute('data-product-id', '2')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('Category — empty state when category has no products (spec §4.6)', () => {
  it('renders the empty message when products array is empty', async () => {
    mockApiGet.mockResolvedValue({
      category: { id: 1, name: 'Vacía', description: '' },
      products: [],
    });
    setupCart();

    renderWithRouter(<Category />);

    await screen.findByText('No hay productos en esta categoría todavía.');
    expect(
      screen.getByText('No hay productos en esta categoría todavía.'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error states
// ---------------------------------------------------------------------------

describe('Category — error states (spec §6.9, §25.3)', () => {
  it('renders error message when API call fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
    setupCart();

    renderWithRouter(<Category />);

    await screen.findByText('Error al cargar la categoría');
    expect(screen.getByText('Error al cargar la categoría')).toBeInTheDocument();
  });

  it('renders not-found UI when API returns 404', async () => {
    const notFoundError = new Error('Not found') as Error & { status: number };
    notFoundError.status = 404;
    mockApiGet.mockRejectedValue(notFoundError);
    setupCart();

    renderWithRouter(<Category />, ['/categories/999']);

    await screen.findByText('Categoría no encontrada');
    expect(screen.getByText('Categoría no encontrada')).toBeInTheDocument();
    expect(
      screen.getByText('La categoría que buscas no existe o fue eliminada.'),
    ).toBeInTheDocument();
  });

  it('renders error for non-numeric categoryId (spec §6.9)', async () => {
    mockApiGet.mockResolvedValue(mockCategoryView);
    setupCart();

    renderWithRouter(<Category />, ['/categories/abc']);

    await screen.findByText('Categoría no válida');
    expect(screen.getByText('Categoría no válida')).toBeInTheDocument();
    // Should not have called the API for non-numeric IDs
    expect(mockApiGet).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Add wiring
// ---------------------------------------------------------------------------

describe('Category — add button calls CartProvider.add (spec §5)', () => {
  it('calls add with the right productId when the add button is clicked', async () => {
    const addFn = vi.fn();
    setupCart(addFn);
    mockApiGet.mockResolvedValue(mockCategoryView);

    renderWithRouter(<Category />);

    await screen.findByText('Teclado Mecánico');

    const productCard = getByAttribute('data-product-id', '1');
    const addButton = productCard.querySelector(
      'button[data-cart-action="add"]',
    ) as HTMLButtonElement;

    await act(async () => {
      addButton.click();
    });

    expect(addFn).toHaveBeenCalledWith(1);
  });
});

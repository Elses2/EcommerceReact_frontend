/**
 * Unit tests for the Search page (`src/pages/Search.tsx`).
 *
 * Mocks the API client (`../lib/api`) and `useCart`
 * (`../providers/CartProvider`) — no network calls in tests.
 * Uses `getByAttribute` from `../test-helpers` for data-*
 * attribute queries per the existing test conventions.
 *
 * @spec (spec §6.13, §26.5)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { Search } from './Search';
import { api } from '../lib/api';
import { useCart } from '../providers/CartProvider';
import { MemoryRouter } from 'react-router-dom';

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
];

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

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Search — renders search results (spec §6.13)', () => {
  it('renders the heading with the query', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/search?q=teclado']}>
        <Search />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(
      screen.getByRole('heading', { name: /Resultados para/ }),
    ).toBeInTheDocument();
  });

  it('renders the breadcrumb with Inicio and Búsqueda', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/search?q=teclado']}>
        <Search />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByText('Búsqueda')).toBeInTheDocument();
  });

  it('renders product cards with data-product-id', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/search?q=teclado']}>
        <Search />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(getByAttribute('data-product-id', '1')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty query
// ---------------------------------------------------------------------------

describe('Search — empty query (spec §26.5)', () => {
  it('renders empty list when q is empty', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/search?q=']}>
        <Search />
      </MemoryRouter>,
    );

    // Should not call the API when query is empty
    expect(mockApiGet).not.toHaveBeenCalled();
    expect(
      screen.getByText('No encontramos productos que coincidan con tu búsqueda.'),
    ).toBeInTheDocument();
  });

  it('renders empty list when q is absent', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/search']}>
        <Search />
      </MemoryRouter>,
    );

    // Should not call the API when query is absent
    expect(mockApiGet).not.toHaveBeenCalled();
    expect(
      screen.getByText('No encontramos productos que coincidan con tu búsqueda.'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// No results
// ---------------------------------------------------------------------------

describe('Search — no results', () => {
  it('renders the no-results message when products array is empty', async () => {
    mockApiGet.mockResolvedValue([]);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/search?q=xyz']}>
        <Search />
      </MemoryRouter>,
    );

    await screen.findByText('No encontramos productos que coincidan con tu búsqueda.');
    expect(
      screen.getByText('No encontramos productos que coincidan con tu búsqueda.'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('Search — error state', () => {
  it('renders error message when API call fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
    setupCart();

    render(
      <MemoryRouter initialEntries={['/search?q=teclado']}>
        <Search />
      </MemoryRouter>,
    );

    await screen.findByText('Error al realizar la búsqueda');
    expect(
      screen.getByText('Error al realizar la búsqueda'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Add wiring
// ---------------------------------------------------------------------------

describe('Search — add button calls CartProvider.add (spec §5)', () => {
  it('calls add with the right productId when the add button is clicked', async () => {
    const addFn = vi.fn();
    setupCart(addFn);
    mockApiGet.mockResolvedValue(mockProducts);

    render(
      <MemoryRouter initialEntries={['/search?q=teclado']}>
        <Search />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');

    const addButton = screen.getByRole('button', { name: 'Agregar al carrito' });

    await act(async () => {
      addButton.click();
    });

    expect(addFn).toHaveBeenCalledWith(1);
  });
});

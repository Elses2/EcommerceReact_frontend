/**
 * Unit tests for the Products page (`src/pages/Products.tsx`).
 *
 * Mocks the API client (`../lib/api`) and `useCart`
 * (`../providers/CartProvider`) — no network calls in tests.
 * Uses `getByAttribute` from `../test-helpers` for data-*
 * attribute queries per the existing test conventions.
 *
 * @spec (spec §6.12, §5, §26.4)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { Products } from './Products';
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
  {
    id: 2,
    name: 'Mouse Óptico',
    price: 8999,
    imageUrl: '/images/mouse.jpg',
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

describe('Products — renders product listing (spec §6.12)', () => {
  it('renders the heading "Todos los Productos"', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(
      screen.getByRole('heading', { name: 'Todos los Productos' }),
    ).toBeInTheDocument();
  });

  it('renders the breadcrumb with Inicio and Productos', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
  });

  it('renders product cards with data-product-id', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(getByAttribute('data-product-id', '1')).toBeInTheDocument();
    expect(getByAttribute('data-product-id', '2')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sort control
// ---------------------------------------------------------------------------

describe('Products — sort control (spec §6.12, §26.4)', () => {
  it('fetches products with sort=asc by default', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(mockApiGet).toHaveBeenCalledWith('/products?sort=asc');
  });

  it('fetches products with sort=desc when sort param is desc', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/products?sort=desc']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(mockApiGet).toHaveBeenCalledWith('/products?sort=desc');
  });

  it('ignores invalid sort param and defaults to asc', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/products?sort=invalid']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');
    expect(mockApiGet).toHaveBeenCalledWith('/products?sort=asc');
  });

  it('updates URL sort param when sort dropdown changes', async () => {
    mockApiGet.mockResolvedValue(mockProducts);
    setupCart();

    const { container } = render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('Teclado Mecánico');

    const select = container.querySelector('select[data-sort-control]');
    expect(select).toBeInTheDocument();

    const user = (await import('@testing-library/user-event')).default.setup();
    await user.selectOptions(select!, 'desc');

    // After changing sort, the API should be called with sort=desc
    expect(mockApiGet).toHaveBeenCalledWith('/products?sort=desc');
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('Products — empty state (spec §6.12)', () => {
  it('renders the empty message when products array is empty', async () => {
    mockApiGet.mockResolvedValue([]);
    setupCart();

    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('No hay productos disponibles por ahora.');
    expect(
      screen.getByText('No hay productos disponibles por ahora.'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('Products — error state', () => {
  it('renders error message when API call fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
    setupCart();

    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>,
    );

    await screen.findByText('Error al cargar los productos');
    expect(
      screen.getByText('Error al cargar los productos'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Add wiring
// ---------------------------------------------------------------------------

describe('Products — add button calls CartProvider.add (spec §5)', () => {
  it('calls add with the right productId when the add button is clicked', async () => {
    const addFn = vi.fn();
    setupCart(addFn);
    mockApiGet.mockResolvedValue(mockProducts);

    render(
      <MemoryRouter initialEntries={['/products']}>
        <Products />
      </MemoryRouter>,
    );

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

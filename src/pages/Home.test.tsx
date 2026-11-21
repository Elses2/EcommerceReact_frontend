/**
 * Unit tests for the Home page (`src/pages/Home.tsx`).
 *
 * Mocks the API client (`../lib/api`) and `useCart`
 * (`../providers/CartProvider`) — no network calls in tests.
 * Uses `getByAttribute` from `../test-helpers` for data-*
 * attribute queries per the existing test conventions.
 *
 * @spec (spec §4.1, §5, §6.6, §6.6b, §6.7, §25.2)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { Home } from './Home';
import { api } from '../lib/api';
import { useCart } from '../providers/CartProvider';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('../providers/CartProvider', () => ({
  useCart: vi.fn(),
}));

vi.mock('../organisms/CategoryNav', () => ({
  CategoryNav: () => <nav data-testid="category-nav">Categorías</nav>,
}));

const mockApiGet = vi.mocked(api.get);
const mockUseCart = vi.mocked(useCart);

beforeEach(() => {
  vi.clearAllMocks();
});

const mockBanners = [
  {
    title: 'Promo Verano',
    subtitle: 'Hasta 50% off',
    imageUrl: '/banners/summer.jpg',
    linkUrl: '/promo/summer',
  },
];

const mockSuggested = [
  {
    id: 1,
    name: 'Teclado Mecánico',
    price: 15000,
    imageUrl: '/images/keyboard.jpg',
    inStock: true,
    categories: ['Periféricos'],
  },
];

const mockMostOrdered = [
  {
    id: 2,
    name: 'Mouse Óptico',
    price: 8999,
    imageUrl: '/images/mouse.jpg',
    inStock: true,
    categories: ['Periféricos'],
  },
];

const mockHomeView = {
  banners: mockBanners,
  suggested: mockSuggested,
  mostOrdered: mockMostOrdered,
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

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Home — renders three sections with mock data (spec §4.1)', () => {
  it('renders the three product-grid sections', async () => {
    mockApiGet.mockResolvedValue(mockHomeView);
    setupCart();

    render(<Home />);

    await screen.findByText('Teclado Mecánico');

    expect(
      screen.getByRole('heading', { name: 'Te puede interesar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Los más pedidos' }),
    ).toBeInTheDocument();
  });

  it('renders banners section after data loads', async () => {
    mockApiGet.mockResolvedValue(mockHomeView);
    setupCart();

    render(<Home />);

    await screen.findByText('Promo Verano');

    const bannerSection = screen.getByRole('region', {
      name: 'Promociones',
    });
    expect(bannerSection).toBeInTheDocument();
  });

  it('renders product cards with data-product-id', async () => {
    mockApiGet.mockResolvedValue(mockHomeView);
    setupCart();

    render(<Home />);

    await screen.findByText('Teclado Mecánico');

    expect(getByAttribute('data-product-id', '1')).toBeInTheDocument();
    expect(getByAttribute('data-product-id', '2')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

describe('Home — renders banners (spec §6.6b)', () => {
  it('renders banner title and subtitle after load', async () => {
    mockApiGet.mockResolvedValue(mockHomeView);
    setupCart();

    render(<Home />);

    await screen.findByText('Promo Verano');

    expect(screen.getByText('Promo Verano')).toBeInTheDocument();
    expect(screen.getByText('Hasta 50% off')).toBeInTheDocument();
  });

  it('renders banner image with correct src and alt after load', async () => {
    mockApiGet.mockResolvedValue(mockHomeView);
    setupCart();

    render(<Home />);

    await screen.findByText('Promo Verano');

    const img = screen.getByRole('img', { name: 'Promo Verano' });
    expect(img).toHaveAttribute('src', '/banners/summer.jpg');
  });

  it('renders banner link with href after load', async () => {
    mockApiGet.mockResolvedValue(mockHomeView);
    setupCart();

    render(<Home />);

    await screen.findByText('Promo Verano');

    const link = getByAttribute('href', '/promo/summer');
    expect(link).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

describe('Home — empty states (spec §4.1)', () => {
  it('renders sections when banners array is empty', async () => {
    mockApiGet.mockResolvedValue({
      banners: [],
      suggested: mockSuggested,
      mostOrdered: mockMostOrdered,
    });
    setupCart();

    render(<Home />);

    await screen.findByText('Teclado Mecánico');

    // Banners section exists but has no items
    const bannerSection = screen.getByRole('region', {
      name: 'Promociones',
    });
    expect(bannerSection).toBeInTheDocument();
    expect(
      bannerSection.querySelectorAll('li').length,
    ).toBe(0);
  });

  it('renders sections when suggested array is empty', async () => {
    mockApiGet.mockResolvedValue({
      banners: mockBanners,
      suggested: [],
      mostOrdered: mockMostOrdered,
    });
    setupCart();

    render(<Home />);

    await screen.findByText('Mouse Óptico');

    // "Te puede interesar" heading is present but no products
    expect(
      screen.getByRole('heading', { name: 'Te puede interesar' }),
    ).toBeInTheDocument();
  });

  it('renders sections when mostOrdered array is empty', async () => {
    mockApiGet.mockResolvedValue({
      banners: mockBanners,
      suggested: mockSuggested,
      mostOrdered: [],
    });
    setupCart();

    render(<Home />);

    await screen.findByText('Teclado Mecánico');

    // "Los más pedidos" heading is present but no products
    expect(
      screen.getByRole('heading', { name: 'Los más pedidos' }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('Home — error state', () => {
  it('renders error message when API call fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
    setupCart();

    render(<Home />);

    await screen.findByText('Error al cargar la página');
    expect(screen.getByText('Error al cargar la página')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Add button
// ---------------------------------------------------------------------------

describe('Home — add button calls CartProvider.add (spec §5)', () => {
  it('calls add with the right productId when the add button is clicked', async () => {
    const addFn = vi.fn();
    setupCart(addFn);
    mockApiGet.mockResolvedValue(mockHomeView);

    render(<Home />);

    await screen.findByText('Teclado Mecánico');

    // Find the add button for product 1 specifically using data-product-id
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

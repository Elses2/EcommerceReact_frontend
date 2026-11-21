import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Header } from './Header';

vi.mock('../providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../organisms/CategoryNav', () => ({
  CategoryNav: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: null,
    status: 'guest',
    logout: vi.fn(),
  });
});

describe('Header organism (spec §3, organisms/header.ejs)', () => {
  it('renders a logo link to home', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    const logo = screen.getByRole('link', { name: /mi\s*ecommerce/i });
    expect(logo).toHaveAttribute('href', '/');
  });

  it('renders SearchBar', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar productos' })).toBeInTheDocument();
  });

  it('renders HeaderRight with cart icon and profile', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /carrito de compras/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /perfil de invitado/i })).toBeInTheDocument();
  });

  it('calls provider logout when logout button is clicked', async () => {
    const logout = vi.fn();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'customer' },
      status: 'authenticated',
      logout,
    });
    const user = (await import('@testing-library/user-event')).default.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Salir' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('preserves data-auth-logout on logout button', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'customer' },
      status: 'authenticated',
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(document.querySelector('[data-auth-logout]')).toBeInTheDocument();
  });
});

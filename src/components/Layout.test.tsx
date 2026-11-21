import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Layout } from './Layout';

vi.mock('../providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../organisms/CategoryNav', () => ({
  CategoryNav: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Layout (spec §5 data-logged-in contract)', () => {
  it('renders data-logged-in="true" when auth status is authenticated', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'customer' },
      status: 'authenticated',
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout><div>Page content</div></Layout>
      </MemoryRouter>,
    );
    const root = document.querySelector('[data-logged-in]');
    expect(root).toBeInTheDocument();
    expect(root!).toHaveAttribute('data-logged-in', 'true');
  });

  it('renders data-logged-in="false" when auth status is guest', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      status: 'guest',
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout><div>Page content</div></Layout>
      </MemoryRouter>,
    );
    const root = document.querySelector('[data-logged-in]');
    expect(root).toBeInTheDocument();
    expect(root!).toHaveAttribute('data-logged-in', 'false');
  });

  it('omits data-logged-in entirely while auth status is loading (S13 contract)', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      status: 'loading',
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout><div>Page content</div></Layout>
      </MemoryRouter>,
    );
    expect(document.querySelector('[data-logged-in]')).not.toBeInTheDocument();
  });

  it('renders children inside main', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      status: 'guest',
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout><div>Page content</div></Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });
});

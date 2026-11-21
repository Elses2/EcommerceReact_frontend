import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryNav } from './CategoryNav';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CategoryNav organism (spec §6.6b, organisms/categories-nav.ejs)', () => {
  it('renders fetched categories as MenuItem links', async () => {
    const categories = [
      { id: 1, name: 'Electrónica' },
      { id: 2, name: 'Ropa' },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(categories);
    render(<CategoryNav />);
    const link1 = await screen.findByRole('link', { name: 'Electrónica' });
    expect(link1).toBeInTheDocument();
    expect(link1).toHaveAttribute('href', '/categories/1');
    const link2 = await screen.findByRole('link', { name: 'Ropa' });
    expect(link2).toBeInTheDocument();
    expect(link2).toHaveAttribute('href', '/categories/2');
  });

  it('fetches categories exactly once via api.get', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, name: 'Electrónica' },
    ]);
    render(<CategoryNav />);
    await screen.findByRole('link', { name: 'Electrónica' });
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/categories');
  });
});

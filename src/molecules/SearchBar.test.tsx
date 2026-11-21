import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar molecule (spec §3, molecules/search.ejs)', () => {
  it('renders a search form with role="search"', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('renders a search input with aria-label', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByRole('searchbox', { name: 'Buscar productos' })).toBeInTheDocument();
  });

  it('renders a submit button with SVG icon', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
  });

  it('calls onSearch with the query on form submission', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'zapatos');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledWith('zapatos');
  });

  it('uses the action prop on the form', () => {
    render(<SearchBar action="/custom-search" onSearch={vi.fn()} />);
    expect(screen.getByRole('search')).toHaveAttribute('action', '/custom-search');
  });

  it('uses the placeholder prop', () => {
    render(<SearchBar placeholder="Buscar productos..." onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
  });
});

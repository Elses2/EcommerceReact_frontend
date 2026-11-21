import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MenuItem } from './MenuItem';

describe('MenuItem atom (spec §3, atoms/menu-item.ejs)', () => {
  it('renders as <a> when href is provided', () => {
    render(<MenuItem label="Inicio" href="/" />);
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
  });

  it('renders as <button> when href is omitted', () => {
    render(<MenuItem label="Acción" />);
    expect(screen.getByRole('button', { name: 'Acción' })).toBeInTheDocument();
  });

  it('applies active styling and aria-current when active', () => {
    render(<MenuItem label="Inicio" href="/" active />);
    const link = screen.getByRole('link', { name: 'Inicio' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('applies non-active styling when not active', () => {
    render(<MenuItem label="Inicio" href="/" active={false} />);
    const link = screen.getByRole('link', { name: 'Inicio' });
    expect(link).not.toHaveAttribute('aria-current');
  });
});

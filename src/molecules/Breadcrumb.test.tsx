import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb molecule (spec §3, molecules/breadcrumb.ejs)', () => {
  it('renders items as links when href is provided', () => {
    render(
      <Breadcrumb
        items={[{ label: 'Categoría', href: '/categories/1' }, { label: 'Detalle' }]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Categoría' })).toBeInTheDocument();
    expect(screen.getByText('Detalle')).toBeInTheDocument();
  });

  it('marks the last item as aria-current="page"', () => {
    render(<Breadcrumb items={[{ label: 'Inicio' }]} />);
    expect(screen.getByText('Inicio')).toHaveAttribute('aria-current', 'page');
  });

  it('renders a back link when back prop is provided', () => {
    render(<Breadcrumb back={{ href: '/', label: 'Volver' }} items={[{ label: 'Categoría' }]} />);
    expect(screen.getByRole('link', { name: '← Volver' })).toBeInTheDocument();
  });

  it('renders a nav element with aria-label="Breadcrumb"', () => {
    render(<Breadcrumb items={[{ label: 'Home' }]} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders chevron separators between items', () => {
    render(
      <Breadcrumb items={[{ label: 'A' }, { label: 'B' }]} />,
    );
    const chevrons = screen.getAllByText('›');
    expect(chevrons.length).toBeGreaterThanOrEqual(1);
  });
});

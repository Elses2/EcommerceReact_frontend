import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer organism (spec §3, organisms/footer.ejs)', () => {
  it('renders copyright text', () => {
    render(<Footer />);
    expect(
      screen.getByText(/MiEcommerce\. Todos los derechos reservados/i),
    ).toBeInTheDocument();
  });

  it('renders social icon links', () => {
    render(<Footer />);
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument();
  });

  it('renders store badges', () => {
    render(<Footer />);
    expect(
      screen.getByLabelText('Descargar en App Store'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Disponible en Google Play'),
    ).toBeInTheDocument();
  });
});

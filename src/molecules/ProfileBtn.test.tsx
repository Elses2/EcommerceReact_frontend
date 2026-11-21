import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileBtn } from './ProfileBtn';

describe('ProfileBtn molecule (spec §3, molecules/profile-btn.ejs)', () => {
  it('renders with a name and href', () => {
    render(<ProfileBtn name="Alice" href="/profile" />);
    const link = screen.getByRole('link', { name: 'Perfil de Alice' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/profile');
  });

  it('defaults to "Invitado" when name is omitted', () => {
    render(<ProfileBtn />);
    expect(screen.getByRole('link', { name: 'Perfil de Invitado' })).toBeInTheDocument();
  });

  it('defaults href to "/login" when omitted', () => {
    render(<ProfileBtn name="Bob" />);
    expect(screen.getByRole('link', { name: 'Perfil de Bob' })).toHaveAttribute('href', '/login');
  });

  it('renders the ProfilePic atom inside the link', () => {
    render(<ProfileBtn name="Alice" />);
    // Sin src, ProfilePic muestra la inicial en un span aria-hidden (fiel al
    // monolito, atoms/profile-pic.ejs): no hay <img> que consultar.
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getByAttribute } from '../test-helpers';
import { HeaderRight } from './HeaderRight';

describe('HeaderRight molecule (spec §3, molecules/header-right.ejs)', () => {
  it('renders CartIcon and ProfileBtn', () => {
    render(<HeaderRight cartCount={2} />);
    expect(getByAttribute('data-cart-count', '2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /perfil de Invitado/i })).toBeInTheDocument();
  });

  it('renders a logout button with data-auth-logout when user is present', () => {
    render(<HeaderRight user={{ name: 'Alice' }} />);
    const logoutBtn = screen.getByRole('button', { name: 'Salir' });
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveAttribute('data-auth-logout', '');
  });

  it('does not render a logout button when no user', () => {
    render(<HeaderRight />);
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument();
  });

  it('calls onLogout when the logout button is clicked', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const onLogout = vi.fn();
    render(<HeaderRight user={{ name: 'Alice' }} onLogout={onLogout} />);
    await user.click(screen.getByRole('button', { name: 'Salir' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('preserves data-auth-logout attribute verbatim from the monolith EJS', () => {
    render(<HeaderRight user={{ name: 'Alice' }} />);
    expect(getByAttribute('data-auth-logout')).toBeInTheDocument();
  });
});

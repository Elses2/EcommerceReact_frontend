import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfilePic } from './ProfilePic';

describe('ProfilePic atom (spec §3, atoms/profile-pic.ejs)', () => {
  it('renders an <img> when src is provided', () => {
    render(<ProfilePic src="https://example.com/photo.jpg" name="Alice" />);
    const img = screen.getByRole('img', { name: 'Alice' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders a fallback <span> with the initial when no src is provided', () => {
    render(<ProfilePic name="Bob" />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders a fallback <span> with uppercase initial', () => {
    render(<ProfilePic name="carol" />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders empty fallback when name is empty', () => {
    const { container } = render(<ProfilePic name="" />);
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('uses the alt prop when provided', () => {
    render(<ProfilePic src="https://example.com/photo.jpg" name="Alice" alt="Alice avatar" />);
    expect(screen.getByRole('img', { name: 'Alice avatar' })).toBeInTheDocument();
  });
});

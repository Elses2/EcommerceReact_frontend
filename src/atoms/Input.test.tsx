import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input atom (spec §3, atoms/input.ejs)', () => {
  it('renders a text input with name and id', () => {
    render(<Input name="email" />);
    // Sin prop label el input no tiene nombre accesible (el label sr-only lo
    // aporta el molecule form-field del monolito); se consulta por rol.
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('id', 'email');
  });

  it('renders a label when label prop is provided', () => {
    render(<Input name="email" label="Correo electrónico" />);
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
  });

  it('renders a hidden error slot when errorSlot is true', () => {
    render(<Input name="email" errorSlot />);
    const errorSlot = screen.getByRole('alert');
    expect(errorSlot).toBeInTheDocument();
    expect(errorSlot).toHaveAttribute('data-error-for', 'email');
  });

  it('does not render error slot when errorSlot is false', () => {
    render(<Input name="email" errorSlot={false} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies dark variant classes', () => {
    // type=password no expone rol textbox: se consulta por su label.
    render(<Input name="password" type="password" variant="dark" label="Contraseña" />);
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveClass('bg-graphite');
  });

  it('applies light variant classes by default', () => {
    render(<Input name="email" label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('bg-white');
  });

  it('passes placeholder and value props', () => {
    render(<Input name="query" placeholder="Buscar..." value="test" />);
    const input = screen.getByPlaceholderText('Buscar...');
    expect(input).toHaveValue('test');
  });

  it('passes autocomplete attribute when provided', () => {
    render(<Input name="email" autocomplete="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
  });
});

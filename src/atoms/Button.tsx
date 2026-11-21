import type { ReactNode } from 'react';

/**
 * Props for the Button atom.
 * @prop children - Button content
 * @prop onClick - Optional click handler
 * @prop variant - Visual style variant
 */
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

/**
 * A simple button atom for the design system.
 * Renders a styled `<button>` element. Data is passed via props; no business logic.
 * @param props - ButtonProps
 */
export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded font-medium ${
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

import type { ReactNode } from 'react';

/**
 * Props for the Input atom.
 * @prop name - HTML name attribute (required).
 * @prop id - HTML id attribute (defaults to `name`).
 * @prop type - HTML input type (defaults to "text").
 * @prop label - Accessible label text rendered as sr-only.
 * @prop placeholder - Placeholder text.
 * @prop value - Controlled input value.
 * @prop variant - Visual variant: "light" or "dark".
 * @prop autocomplete - HTML autocomplete attribute.
 * @prop errorSlot - When true, renders a hidden `<p>` for client-side validation messages.
 * @spec (spec §3, atoms/input.ejs)
 */
interface InputProps {
  name: string;
  id?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  variant?: 'light' | 'dark';
  autocomplete?: string;
  errorSlot?: boolean;
}

/**
 * Text input atom with light/dark variants and an accessible error slot.
 * Purely presentational — no business logic or API calls.
 * Preserves the `data-error-for` attribute from the monolith EJS partial.
 * @param props - InputProps
 * @spec (spec §3, atoms/input.ejs)
 */
export function Input({
  name,
  id,
  type = 'text',
  label,
  placeholder = '',
  value = '',
  variant = 'light',
  autocomplete,
  errorSlot = false,
}: InputProps): ReactNode {
  const inputName = name;
  const inputId = id ?? name;
  const inputType = type;
  const inputVariant = variant;
  const inputValue = value;
  const inputPlaceholder = placeholder;
  const inputAutocomplete = autocomplete;
  const withErrorSlot = errorSlot;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      )}
      <input
        type={inputType}
        id={inputId}
        name={inputName}
        value={inputValue}
        placeholder={inputPlaceholder}
        {...(inputAutocomplete ? { autocomplete: inputAutocomplete } : {})}
        className={`h-10 w-full rounded-full border px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 ${
          inputVariant === 'dark'
            ? 'border-white/25 bg-graphite text-white placeholder-white/50 focus:border-brand'
            : 'border-neutral-300 bg-white text-ink placeholder-muted focus:border-brand'
        }`}
      />
      {withErrorSlot && (
        <p data-error-for={inputId} className="hidden text-sm text-alert" role="alert" />
      )}
    </div>
  );
}

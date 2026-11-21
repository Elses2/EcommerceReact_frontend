import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Props for the SearchBar molecule.
 * @prop action - Form action URL (defaults to "/search").
 * @prop placeholder - Search input placeholder text.
 * @prop value - Initial search query value (the molecule owns its input text,
 * like the monolith form, which let the browser keep the typed value).
 * @prop onSearch - Callback invoked with the query string on form submission.
 * @spec (spec §3, molecules/search.ejs)
 */
interface SearchBarProps {
  action?: string;
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
}

/**
 * Search form molecule composed of a search input and a submit button
 * with an inline SVG search icon. Purely presentational.
 * Mirrors the monolith EJS partial `molecules/search.ejs` (spec §3).
 * The form uses `method="GET"` and `role="search"` for accessibility.
 * @param props - SearchBarProps
 * @spec (spec §3, molecules/search.ejs)
 */
export function SearchBar({
  action = '/search',
  placeholder = '',
  value: initialValue = '',
  onSearch,
}: SearchBarProps): ReactNode {
  // El monolito dejaba que el input guardara su propio texto (form GET);
  // el equivalente React es estado interno inicializado con la prop.
  const [query, setQuery] = useState(initialValue);
  return (
    <form
      action={action}
      method="GET"
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query);
      }}
    >
      <input
        type="search"
        name="query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Buscar productos"
        className="h-8 w-full rounded-full border border-[#dfdfdf] bg-white pl-4 pr-10 text-sm text-ink placeholder:text-ink/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-full text-[#808080] transition-colors hover:text-ink"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx={11} cy={11} r={7} />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}

import { useState } from 'react';
import { Button } from '../atoms/Button';

/**
 * Props for the SearchBar molecule.
 * @prop placeholder - Input placeholder text
 * @prop onSearch - Callback receiving the search query string
 */
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

/**
 * A search bar molecule composed of an input and a button atom.
 * Receives all data via props; no business logic or API calls.
 * @param props - SearchBarProps
 */
export function SearchBar({ placeholder = 'Buscar...', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="flex gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border rounded"
      />
      <Button variant="primary" onClick={() => onSearch(query)}>
        Buscar
      </Button>
    </div>
  );
}

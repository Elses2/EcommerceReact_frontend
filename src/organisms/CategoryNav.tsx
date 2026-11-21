import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { MenuItem } from '../atoms/MenuItem';

/**
 * Category shape from GET /api/categories (spec §6.6b, §25).
 */
export interface Category {
  id: number;
  name: string;
  description?: string;
}

/**
 * Props for CategoryNav organism (no props: data is fetched at mount).
 * @spec (spec §6.6b, organisms/categories-nav.ejs)
 */
interface CategoryNavProps {
  readonly __void?: never;
}

/**
 * Category navigation organism: fetches categories ONCE via the API client
 * (GET /api/categories, spec §6.6b) and renders MenuItem links (`/categories/:id`
 * href shape for F4 routes). Loading and error states handled minimally.
 * Memoized (useEffect with empty deps) so it never refetches on re-renders.
 * @param props - CategoryNavProps
 * @spec (spec §6.6b, organisms/categories-nav.ejs)
 */
export function CategoryNav(props: CategoryNavProps) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  void props;

  useEffect(() => {
    let cancelled = false;
    api
      .get<Category[]>('/categories')
      .then((cats) => {
        if (!cancelled) {
          setCategories(cats);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Error al cargar categorías');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <nav
        aria-label="Categorías de productos"
        className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8"
      >
        <p className="text-sm text-muted">Cargando categorías…</p>
      </nav>
    );
  }

  if (error) {
    return (
      <nav
        aria-label="Categorías de productos"
        className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8"
      >
        <p className="text-sm text-red-600">{error}</p>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Categorías de productos"
      className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8"
    >
      <ul className="flex items-stretch divide-x divide-white/70 overflow-x-auto rounded-xl bg-ink text-white">
        {categories!.map((category) => (
          <li key={category.id} className="min-w-[7.5rem] flex-1 shrink-0">
            <MenuItem label={category.name} href={`/categories/${category.id}`} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

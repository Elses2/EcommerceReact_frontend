/**
 * Search results page — reads the query string from the URL,
 * fetches /api/search, and renders results or an empty state.
 *
 * Empty query (no q parameter or empty string) → empty list
 * per spec §26.5 (mirrors the monolith's behaviour).
 *
 * @spec (spec §6.13, §26.5)
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Product } from '../molecules/Product';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { useCart } from '../providers/CartProvider';
import type { ProductView } from '../molecules/Product';

/**
 * Search results page component. Reads the `q` query parameter,
 * fetches matching products, and renders a breadcrumb, heading,
 * and product grid (or empty state).
 * @param props - void (query comes from URL search params)
 * @spec (spec §6.13, §26.5)
 */
export function Search() {
  const [searchParams] = useSearchParams();
  const { add } = useCart();
  const query = searchParams.get('q') ?? '';
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Empty query → empty list per spec §26.5
    if (!query.trim()) {
      if (!cancelled) {
        setProducts([]);
        setLoading(false);
      }
      return;
    }

    api
      .get<ProductView[]>(`/search?q=${encodeURIComponent(query.trim())}`)
      .then((response) => {
        if (!cancelled) {
          setProducts(response);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Error al realizar la búsqueda');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (loading) {
    return <p>Cargando…</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
      <Breadcrumb
        items={[{ label: 'Inicio', href: '/' }, { label: 'Búsqueda' }]}
      />

      <h1 className="mt-6 text-h1 font-bold text-ink md:mt-8">
        Resultados para &apos;{query}&apos;
      </h1>

      {products.length > 0 ? (
        <div className="mt-6 md:mt-8">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <Product product={product} onAddToCart={add} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">
          No encontramos productos que coincidan con tu búsqueda.
        </p>
      )}
    </div>
  );
}

export default Search;

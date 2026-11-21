/**
 * Products listing page — fetches all products with optional
 * sort control (asc/desc) and renders them in a grid using
 * the Product molecule. Add-to-cart is wired via CartProvider.
 *
 * The sort parameter is read from the URL query string,
 * whitelisted client-side (only 'asc' | 'desc' accepted),
 * and invalid values are ignored (default to 'asc').
 *
 * @spec (spec §6.12, §5, §26.4)
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Product } from '../molecules/Product';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { useCart } from '../providers/CartProvider';
import type { ProductView } from '../molecules/Product';

/** Whitelist of accepted sort values (spec §26.4). */
type SortValue = 'asc' | 'desc';

/**
 * Products listing page component. Fetches products on mount,
 * renders a breadcrumb, heading, sort control, and product grid.
 * Handles loading, error, and empty states inline.
 * @param props - void (sort comes from URL query params)
 * @spec (spec §6.12, §26.4)
 */
export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { add } = useCart();
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawSort = searchParams.get('sort');
  const sort: SortValue =
    rawSort === 'asc' || rawSort === 'desc' ? rawSort : 'asc';

  useEffect(() => {
    let cancelled = false;

    api
      .get<ProductView[]>(`/products?sort=${sort}`)
      .then((response) => {
        if (!cancelled) {
          setProducts(response);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Error al cargar los productos');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sort]);

  /**
   * Updates the URL sort parameter. Only whitelisted values
   * are accepted; any other value is ignored (spec §26.4).
   */
  const handleSortChange = (newSort: string) => {
    if (newSort !== 'asc' && newSort !== 'desc') return;
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === 'asc') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    setSearchParams(params);
  };

  if (loading) {
    return <p>Cargando…</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
      <Breadcrumb
        items={[{ label: 'Inicio', href: '/' }, { label: 'Productos' }]}
      />

      <h1 className="mt-6 text-h1 font-bold text-ink md:mt-8">
        Todos los Productos
      </h1>

      {/* Sort control (spec §6.12) — whitelist client-side */}
      <div className="mt-4 flex items-center gap-2">
        <label htmlFor="sort-select" className="text-sm text-muted">
          Ordenar por precio:
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-full border border-[#dfdfdf] bg-white px-3 py-1 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          data-sort-control
        >
          <option value="asc">Precio: menor a mayor</option>
          <option value="desc">Precio: mayor a menor</option>
        </select>
      </div>

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
          No hay productos disponibles por ahora.
        </p>
      )}
    </div>
  );
}

export default Products;

/**
 * Category page — fetches CategoryView by categoryId and renders
 * a breadcrumb, category name heading, and a grid of products
 * using the Product molecule. Add-to-cart is wired via CartProvider.
 *
 * Backend error handling mirrors the monolith's 404/400 behaviour:
 * - 400 (non-numeric categoryId) → inline error state
 * - 404 (missing category) → inline not-found state
 *
 * @spec (spec §4.6, §5, §6.8, §6.9, §25)
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Product } from '../molecules/Product';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { useCart } from '../providers/CartProvider';
import type { ProductView } from '../molecules/Product';

/** CategoryView shape returned by GET /api/categories/:categoryId (spec §25.2). */
interface CategoryView {
  category: { id: number; name: string; description?: string };
  products: ProductView[];
}

/**
 * Category page component. Fetches the category and its products
 * on mount, renders a breadcrumb, heading, and product grid.
 * Handles loading, error, 400, and 404 states inline.
 * @param props - void (categoryId comes from URL params)
 * @spec (spec §4.6, §25)
 */
export function Category() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { add } = useCart();
  const [data, setData] = useState<CategoryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Validate categoryId is numeric before making the request (spec §6.9)
    const id = Number(categoryId);
    if (!Number.isInteger(id) || id <= 0) {
      if (!cancelled) {
        setError('Categoría no válida');
        setLoading(false);
      }
      return;
    }

    api
      .get<CategoryView>(`/categories/${id}`)
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.status === 404) {
            setNotFound(true);
          } else {
            setError('Error al cargar la categoría');
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (loading) {
    return <p>Cargando…</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (notFound || !data) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center shadow-md md:p-8">
          <h1 className="text-h2 text-ink">Categoría no encontrada</h1>
          <p className="mt-3 text-muted">
            La categoría que buscas no existe o fue eliminada.
          </p>
          <a href="/" className="btn-primary mt-6">
            Volver al inicio
          </a>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
      <Breadcrumb
        items={[{ label: 'Inicio', href: '/' }, { label: data.category.name }]}
      />

      <h1 className="mt-6 text-h1 font-bold text-ink md:mt-8">
        {data.category.name}
      </h1>

      {data.products.length > 0 ? (
        <div className="mt-6 md:mt-8">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.products.map((product) => (
              <li key={product.id}>
                <Product product={product} onAddToCart={add} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">
          No hay productos en esta categoría todavía.
        </p>
      )}
    </div>
  );
}

export default Category;

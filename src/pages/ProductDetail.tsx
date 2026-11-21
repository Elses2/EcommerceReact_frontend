/**
 * Product detail page — fetches ProductDetailView by productId
 * and renders the product image, name, price, stock badge,
 * description, categories, add-to-cart button, and a
 * "Productos relacionados" section with related products.
 *
 * Backend error handling mirrors the monolith's 404/400 behaviour:
 * - 400 (non-numeric productId) → inline error state
 * - 404 (missing product) → inline not-found state
 *
 * @spec (spec §6.8, §6.9, §6.10, §5)
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Product } from '../molecules/Product';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { useCart } from '../providers/CartProvider';
import type { ProductView, CategoryRef } from '../molecules/Product';

/** ProductDetailView shape returned by GET /api/products/:productId (spec §26.2). */
interface ProductDetailView {
  product: ProductView;
  related: ProductView[];
}

/**
 * Product detail page component. Fetches the product and
 * its related products on mount, renders the detail view
 * with add-to-cart and a related products section.
 * Handles loading, error, 400, and 404 states inline.
 * @param props - void (productId comes from URL params)
 * @spec (spec §6.8, §26.2)
 */
export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { add } = useCart();
  const [data, setData] = useState<ProductDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Validate productId is numeric before making the request (spec §6.9)
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      if (!cancelled) {
        setError('Producto no válido');
        setLoading(false);
      }
      return;
    }

    api
      .get<ProductDetailView>(`/products/${productId}`)
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
            setError('Error al cargar el producto');
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

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
          <h1 className="text-h2 text-ink">Producto no encontrado</h1>
          <p className="mt-3 text-muted">
            El producto que buscas no existe o fue eliminado.
          </p>
          <a href="/" className="btn-primary mt-6">
            Volver al inicio
          </a>
        </div>
      </section>
    );
  }

  const { product, related } = data;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
      {(() => {
        const firstCategory = product.categories?.[0];
        return firstCategory ? (
          <Breadcrumb
            back={{ href: '/products', label: 'Volver al listado' }}
            items={[
              {
                label: firstCategory.name,
                href: `/categories/${firstCategory.id}`,
              },
            ]}
          />
        ) : null;
      })()}

      <section
        aria-label={product.name}
        className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-2 md:gap-8"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="aspect-square w-full rounded-2xl object-cover shadow-sm"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = '';
          }}
        />

        <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-h3 font-bold text-ink md:text-h2">
            {product.name}
          </h1>

          <p className="flex items-baseline gap-2">
            <span className="text-h2 font-bold text-ink md:text-h1">
              {product.price.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-muted">PUNTOS</span>
          </p>

          {product.description && (
            <p className="text-sm leading-relaxed text-ink/80">
              {product.description}
            </p>
          )}

          {product.categories && product.categories.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Categorías">
              {product.categories.map((cat: CategoryRef) => (
                <li
                  key={cat.id}
                  className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-muted"
                >
                  {cat.name}
                </li>
              ))}
            </ul>
          )}

          {!product.inStock && (
            <span className="badge badge-out-of-stock">Sin stock</span>
          )}

          <button
            className={`${product.inStock ? 'btn-primary' : 'btn-disabled'} w-full`}
            data-cart-action="add"
            data-product-id={product.id}
            disabled={!product.inStock}
            onClick={() => add(product.id)}
          >
            Agregar al carrito
          </button>
        </div>
      </section>

      {/* Related products section (spec §6.8) */}
      {related.length > 0 ? (
        <div className="mt-8 md:mt-12">
          <h2 className="font-bold text-ink md:text-h3">
            Productos relacionados
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {related.map((relatedProduct) => (
              <li key={relatedProduct.id}>
                <Product
                  product={relatedProduct}
                  onAddToCart={add}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted md:mt-12">
          No hay productos relacionados por ahora.
        </p>
      )}
    </div>
  );
}

export default ProductDetail;

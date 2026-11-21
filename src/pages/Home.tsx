import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Product } from '../molecules/Product';
import { CategoryNav } from '../organisms/CategoryNav';
import { useCart } from '../providers/CartProvider';
import type { ProductView } from '../molecules/Product';

/** Banner shape returned by GET /api/home (spec §25.2). */
interface PromoBanner {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
}

/** Home view shape returned by GET /api/home (spec §25.2). */
interface HomeView {
  banners: PromoBanner[];
  suggested: ProductView[];
  mostOrdered: ProductView[];
}

/**
 * Home page: fetches GET /api/home once on mount and renders the
 * three sections (banners, "Te puede interesar", "Los más pedidos")
 * using existing molecules. Each product card's add button is wired
 * to CartProvider.add(productId). Loading and error states are
 * minimal. No business logic — the page maps API data to props.
 *
 * Section order mirrors the monolith home page (spec §4.1):
 * categories nav (top) → banners → "Te puede interesar" →
 * "Los más pedidos" → categories nav (bottom).
 *
 * @spec (spec §4.1, §5, §6.6, §6.6b, §6.7, §25.2)
 */
export function Home() {
  const { add } = useCart();
  const [data, setData] = useState<HomeView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<HomeView>('/home')
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Error al cargar la página');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p>Cargando…</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8 py-6 md:py-8">
      <CategoryNav />

      {/* Banners carousel (spec §6.6b, organisms/product-hero.ejs) */}
      <section
        aria-label="Promociones"
        className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8"
      >
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto">
          {data.banners.map((banner) => (
            <li
              key={banner.title}
              className="w-full shrink-0 snap-center"
            >
              <a
                href={banner.linkUrl || '#'}
                className="group relative block h-56 overflow-hidden rounded-2xl md:h-72"
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '';
                  }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
                  <h2 className="font-bold md:text-h3">{banner.title}</h2>
                  {banner.subtitle && (
                    <p className="mt-1 max-w-md text-sm md:text-base">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* "Te puede interesar" (spec §6.6, organisms/product-grid.ejs) */}
      <section
        aria-label="Te puede interesar"
        className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8"
      >
        <h2 className="font-bold text-ink md:text-h3">
          Te puede interesar
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.suggested.map((product) => (
            <li key={product.id}>
              <Product product={product} onAddToCart={add} />
            </li>
          ))}
        </ul>
      </section>

      {/* "Los más pedidos" (spec §6.7, organisms/product-grid.ejs) */}
      <section
        aria-label="Los más pedidos"
        className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8"
      >
        <h2 className="font-bold text-ink md:text-h3">Los más pedidos</h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.mostOrdered.map((product) => (
            <li key={product.id}>
              <Product product={product} onAddToCart={add} />
            </li>
          ))}
        </ul>
      </section>

      <CategoryNav />
    </div>
  );
}

export default Home;

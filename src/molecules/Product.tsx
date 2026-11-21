import type { ReactNode } from 'react';

/**
 * Props for the Product molecule.
 * @prop product - Product view object with id, name, price, imageUrl, inStock, categories.
 * @prop fallbackImageUrl - URL used when the product image fails to load.
 * @prop onAddToCart - Callback invoked when the "Agregar al carrito" button is clicked.
 * @spec (spec §3, molecules/product.ejs)
 */
interface ProductView {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  categories?: string[];
}

interface ProductProps {
  product: ProductView;
  fallbackImageUrl?: string;
  onAddToCart?: (productId: number) => void;
}

/**
 * Product card molecule: white rounded card with square image, name,
 * price, stock badge, and "Agregar al carrito" button. Purely presentational.
 * Mirrors the monolith EJS partial `molecules/product.ejs` (spec §3).
 * Preserves the `data-product-id` attribute on the article root and
 * `data-cart-action="add"` + `data-product-id` on the button for F6 parity.
 * @param props - ProductProps
 * @spec (spec §3, molecules/product.ejs)
 */
export function Product({ product, fallbackImageUrl = '', onAddToCart }: ProductProps): ReactNode {
  return (
    <article
      data-product-id={product.id}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <img
        src={product.imageUrl}
        alt={product.name}
        className="aspect-square w-full object-cover"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = fallbackImageUrl;
        }}
      />
      <div className="flex flex-col gap-3 p-4">
        <h3 className="font-bold text-ink">
          <a
            href={`/products/${product.id}`}
            className="after:absolute after:inset-0 after:content-[''] rounded-2xl group-hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {product.name}
          </a>
        </h3>
        <p className="flex items-baseline gap-2">
          <span className="font-bold text-ink">
            {product.price.toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-muted">PUNTOS</span>
        </p>
        {!product.inStock && (
          <span className="badge badge-out-of-stock">Sin stock</span>
        )}
        <button
          className={`${product.inStock ? 'btn-primary' : 'btn-disabled'} relative z-10 w-full`}
          data-cart-action="add"
          data-product-id={product.id}
          disabled={!product.inStock}
          onClick={() => onAddToCart?.(product.id)}
        >
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}

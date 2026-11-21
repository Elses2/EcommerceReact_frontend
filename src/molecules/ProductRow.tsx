import type { ReactNode } from 'react';

/**
 * Props for the ProductRow molecule.
 * @prop product - Product view object with id, name, imageUrl.
 * @prop fallbackImageUrl - URL used when the product image fails to load.
 * @prop href - Navigation URL (defaults to "#").
 * @spec (spec §3, molecules/product-row.ejs)
 */
interface ProductView {
  id: number;
  name: string;
  imageUrl: string;
}

interface ProductRowProps {
  product: ProductView;
  fallbackImageUrl?: string;
  href?: string;
}

/**
 * Compact horizontal product row molecule: image + name + id + chevron.
 * Purely presentational.
 * Mirrors the monolith EJS partial `molecules/product-row.ejs` (spec §3).
 * @param props - ProductRowProps
 * @spec (spec §3, molecules/product-row.ejs)
 */
export function ProductRow({
  product,
  fallbackImageUrl = '',
  href = '#',
}: ProductRowProps): ReactNode {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm transition-colors hover:bg-graphite/5"
    >
      <img
        src={product.imageUrl}
        alt={product.name}
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = fallbackImageUrl;
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-ink">{product.name}</span>
        <span className="block text-xs text-muted">#{product.id}</span>
      </span>
      <span className="shrink-0 text-ink [&_svg]:h-5 [&_svg]:w-5" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </a>
  );
}

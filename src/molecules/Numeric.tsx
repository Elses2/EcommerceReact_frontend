import type { ReactNode } from 'react';

/**
 * Props for the Numeric molecule.
 * @prop productId - Numeric product identifier used in data attributes.
 * @prop quantity - Current quantity value displayed in the control.
 * @prop onDecrease - Callback invoked when the − button is clicked.
 * @prop onIncrease - Callback invoked when the + button is clicked.
 * @spec (spec §3, molecules/numeric.ejs)
 */
interface NumericProps {
  productId: number;
  quantity: number;
  onDecrease?: () => void;
  onIncrease?: () => void;
}

/**
 * Quantity stepper molecule: − N + in a pill border. Purely presentational.
 * Mirrors the monolith EJS partial `molecules/numeric.ejs` (spec §3).
 * Preserves the `data-cart-action`, `data-product-id`, and `data-quantity`
 * attributes from the monolith EJS partial for F6 parity.
 * @param props - NumericProps
 * @spec (spec §3, molecules/numeric.ejs)
 */
export function Numeric({
  productId,
  quantity,
  onDecrease,
  onIncrease,
}: NumericProps): ReactNode {
  return (
    <div
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-ink/15 bg-white px-2 py-1"
      role="group"
      aria-label="Cantidad del producto"
    >
      <button
        type="button"
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-base leading-none text-ink transition-colors hover:bg-ink/5"
        data-cart-action="decrease"
        data-product-id={productId}
        aria-label="Reducir cantidad"
        onClick={onDecrease}
      >
        −
      </button>
      <span className="min-w-4 text-center text-sm font-semibold text-ink" data-quantity>
        {quantity}
      </span>
      <button
        type="button"
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-base leading-none text-ink transition-colors hover:bg-ink/5"
        data-cart-action="increase"
        data-product-id={productId}
        aria-label="Aumentar cantidad"
        onClick={onIncrease}
      >
        +
      </button>
    </div>
  );
}

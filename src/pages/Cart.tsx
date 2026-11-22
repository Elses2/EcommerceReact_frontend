/**
 * /cart page (spec §4.2).
 *
 * Blocks:
 *   - "← Volver" link to `/`
 *   - h1 "Productos en tu Carrito"
 *   - Cart item list (one row per item, with data-cart-item attribute)
 *   - Summary area (data-cart-summary) with total (data-cart-total),
 *     "Vaciar carrito" (data-cart-action="clear"), and checkout link to /checkout
 *   - Empty state (data-cart-empty) when cart is empty
 *
 * All `data-*` attributes are preserved verbatim from the monolith
 * (spec §5 / F6 parity). Business logic lives in CartProvider; this page
 * only renders state and fires actions.
 * @spec (spec §4.2, §5, §24.3)
 */

import { Link } from "react-router-dom";
import { useCart } from "../providers/CartProvider";
import { Numeric } from "../molecules/Numeric";

/**
 * Renders the /cart page with item list, quantity controls, totals,
 * empty-cart state, and a checkout CTA link.
 * @spec (spec §4.2, §5)
 */
export function Cart() {
  const { cart, increase, decrease, remove, clear } = useCart();
  const isEmpty = cart.count === 0;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
      <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-brand">
        ← Volver
      </a>

      <h1 className="mt-3 text-h3 text-ink">Productos en tu Carrito</h1>

      <ul
        id="cart-items"
        aria-label="Productos en el carrito"
        className={`mt-6 flex flex-col gap-4 ${isEmpty ? 'hidden' : ''}`}
        data-testid="cart-items"
      >
        {cart.items.map((item) => (
          <li
            key={item.productId}
            data-cart-item={item.productId}
            data-testid={`cart-item-${item.productId}`}
            className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-12 w-12 shrink-0 rounded-lg bg-ink/5 object-contain sm:h-14 sm:w-14"
                loading="lazy"
              />
              <h3 className="min-w-0 font-medium text-ink">{item.name}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-secondary h-9 px-5 text-xs"
                data-cart-action="remove"
                data-product-id={item.productId}
                aria-label={`Quitar ${item.name} del carrito`}
                onClick={() => remove(item.productId)}
              >
                Quitar
              </button>
              <Numeric
                productId={item.productId}
                quantity={item.quantity}
                onDecrease={() => decrease(item.productId)}
                onIncrease={() => increase(item.productId)}
              />
              <span
                className="ml-auto text-lg font-bold text-ink sm:ml-2"
                data-subtotal
                data-testid={`subtotal-${item.productId}`}
              >
                {item.subtotal.toLocaleString("es-AR")}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <section
        data-cart-summary
        data-testid="cart-summary"
        aria-label="Resumen de compra"
        className="mt-8 flex flex-col items-end gap-4"
        style={{ display: isEmpty ? "none" : "flex" }}
      >
        <p className="flex items-baseline gap-3">
          <span className="text-ink">Total de Puntos</span>
          <span
            className="text-xl font-bold text-ink"
            data-cart-total
            data-testid="cart-total"
          >
            {cart.total.toLocaleString("es-AR")}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-secondary"
            data-cart-action="clear"
            onClick={clear}
          >
            Vaciar carrito
          </button>
          <Link to="/checkout" className="btn-primary">
            Ir a Pagar
          </Link>
        </div>
      </section>

      <div
        data-cart-empty
        data-testid="cart-empty"
        className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm"
        style={{ display: isEmpty ? "block" : "none" }}
      >
        <p className="text-muted">Tu carrito está vacío.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default Cart;

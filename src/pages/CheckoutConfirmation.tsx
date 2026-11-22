/**
 * /checkout/confirmation/:token page (spec §19/D7, §27).
 *
 * Public route (no RequireAuth — spec §27.2: the confirmation endpoint
 * is public and the token is the credential per D7). Reads the token
 * from the URL, fetches GET /api/checkout/confirmation/:token, and
 * renders the ConfirmationView minimally: order id/total/status/created_at
 * plus items (name, qty, unit_price). A 404 response renders a
 * not-found UI.
 *
 * data-* attributes: none specific to this page (uses standard
 * semantic HTML + testids).
 *
 * @spec (spec §19/D7, §27.2)
 */

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

// ---------------------------------------------------------------------------
// Types (mirror ConfirmationView from spec §27.2)
// ---------------------------------------------------------------------------

interface ConfirmationOrder {
  id: number;
  total: number;
  status: string;
  created_at: string;
}

interface ConfirmationItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface ConfirmationView {
  order: ConfirmationOrder;
  items: ConfirmationItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders the order confirmation for a given token.
 * Fetches GET /api/checkout/confirmation/:token (public, spec §27.2).
 * On 404 shows a not-found UI; on success renders the minimal shape
 * per spec §27.2 (order id/total/status/created_at + items).
 * @spec (spec §19/D7, §27.2)
 */
export function CheckoutConfirmation() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<ConfirmationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    api
      .get<ConfirmationView>(`/checkout/confirmation/${token}`)
      .then((data) => {
        if (!cancelled) {
          setView(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.status === 404) {
            setNotFound(true);
          } else {
            setError("No se pudo cargar la confirmación.");
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-10 md:py-16">
        <p className="text-muted">Cargando confirmación…</p>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center shadow-md md:p-8">
          <h1 className="text-h2 text-ink">Página no encontrada</h1>
          <p className="mt-3 text-muted">La página que buscas no existe o fue movida.</p>
          <Link to="/" className="btn-primary mt-6">
            Volver al inicio
          </Link>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-10 md:py-16">
        <p className="text-alert">{error}</p>
      </section>
    );
  }

  if (!view) {
    return null;
  }

  const { order, items } = view;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 md:py-16">
      <div className="rounded-2xl bg-white p-6 text-center shadow-md md:p-10">
        <h1 className="text-h2 text-ink">¡Gracias por tu compra!</h1>
        <p className="mt-3 text-muted">Tu orden fue confirmada correctamente.</p>
        <p className="mt-4 text-sm text-ink">
          Número de orden: <span className="font-bold">{order.id}</span>
        </p>
        <p className="mt-1 text-sm text-ink">
          Estado: <span className="font-bold">{order.status}</span>
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-h3 text-ink">Detalle de tu compra</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <span className="text-ink">
                {item.product_name}
                <span className="text-muted"> × {item.quantity}</span>
              </span>
              <span className="font-medium text-ink">
                {(item.quantity * item.unit_price).toLocaleString("es-AR")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
          <span className="text-ink">Total</span>
          <span className="text-xl font-bold text-ink">
            {order.total.toLocaleString("es-AR")}
          </span>
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

/**
 * /checkout page (spec §19). Behind RequireAuth.
 *
 * On mount fetches GET /api/checkout for the checkoutToken + cart summary.
 * If the cart is empty, shows the empty-cart state (mirrors Cart.tsx).
 * Form fields and client-side validation mirror checkout-validation.js (spec §19.5).
 * On submit POSTs /api/checkout with the checkoutToken; 201 navigates to
 * /checkout/confirmation/<confirmationToken>; 400 surfaces field errors per-field
 * and general errors (stock, etc.) in the error box. After success, clears the
 * cart via CartProvider so the provider state stays in sync with the server.
 *
 * data-* attributes preserved verbatim from the monolith checkout.ejs (spec §5):
 *   data-checkout-form, data-checkout-errors, data-checkout-errors-list,
 *   data-checkout-summary, data-checkout-total, data-checkout-submit,
 *   data-error-for="{fieldName}", data-cart-empty
 *
 * @spec (spec §19, §19.2, §19.5, §24.2, §24.3, §5)
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../providers/CartProvider";
import { api, ValidationError } from "../lib/api";
import type { ChangeEvent, FormEvent } from "react";
import { RequireAuth } from "../components/RequireAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the GET /api/checkout response (spec §19.2). */
interface CheckoutView {
  checkoutToken: string;
  cart: {
    items: Array<{
      productId: number;
      quantity: number;
      name: string;
      price: number;
      imageUrl: string;
      inStock: boolean;
      subtotal: number;
    }>;
    total: number;
    count: number;
  };
}

/** Per-field error map used by client-side validation. */
interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  paymentMethod?: string;
}

// ---------------------------------------------------------------------------
// Validation (mirrors checkout-validation.js, spec §19.5)
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = ["transfer", "cash_on_delivery", "card"];

function isNonEmptyAfterTrim(value: string): boolean {
  return value.trim().length > 0;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function phoneDigits(value: string): string {
  return value.replace(/[\s+\-()]/g, "");
}

function isValidPhone(value: string): boolean {
  return /^\d{7,15}$/.test(phoneDigits(value));
}

/**
 * Validates ONE field against spec §19.5. Pure: no DOM.
 * @param fieldName - The form field name
 * @param rawValue - The field's current (untrimmed) value
 * @returns Specific error message, or "" when valid
 * @spec (spec §19.5)
 */
function validateField(
  fieldName: string,
  rawValue: string,
): string {
  const value = typeof rawValue === "string" ? rawValue : "";

  if (!isNonEmptyAfterTrim(value)) {
    switch (fieldName) {
      case "firstName":
        return "El nombre es obligatorio.";
      case "lastName":
        return "El apellido es obligatorio.";
      case "email":
        return "El email es obligatorio.";
      case "phone":
        return "El teléfono es obligatorio.";
      case "address":
        return "La dirección es obligatoria.";
      case "city":
        return "La ciudad es obligatoria.";
      case "postalCode":
        return "El código postal es obligatorio.";
      case "country":
        return "El país es obligatorio.";
      case "paymentMethod":
        return "Seleccioná un método de pago.";
      default:
        return "";
    }
  }

  const trimmed = value.trim();

  if (fieldName === "email") {
    if (trimmed.length > 254) return "El email no puede superar los 254 caracteres.";
    if (!isValidEmail(trimmed)) return "Ingresá un email válido (ej: nombre@dominio.com).";
  }
  if (fieldName === "phone" && !isValidPhone(value)) {
    return "El teléfono debe tener entre 7 y 15 dígitos.";
  }
  if (fieldName === "firstName" && trimmed.length > 100) {
    return "El nombre no puede superar los 100 caracteres.";
  }
  if (fieldName === "lastName" && trimmed.length > 100) {
    return "El apellido no puede superar los 100 caracteres.";
  }
  if (
    (fieldName === "address" || fieldName === "city" || fieldName === "country") &&
    trimmed.length > 200
  ) {
    return "Este campo no puede superar los 200 caracteres.";
  }
  if (fieldName === "postalCode" && trimmed.length > 20) {
    return "El código postal no puede superar los 20 caracteres.";
  }
  if (fieldName === "paymentMethod" && PAYMENT_METHODS.indexOf(value) === -1) {
    return "El método de pago no es válido.";
  }

  return "";
}

/**
 * Validates the whole form. Pure: no DOM.
 * @param values map of field name → raw value
 * @returns map of field → specific error message ("" when valid)
 * @spec (spec §19.5)
 */
function validateForm(values: Record<string, string>): FieldErrors {
  const fields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "city",
    "postalCode",
    "country",
    "paymentMethod",
  ];
  const errors: FieldErrors = {};
  fields.forEach((field) => {
    const err = validateField(field, values[field] || "");
    if (err) errors[field as keyof FieldErrors] = err;
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Checkout page: form with shipping/payment fields, client-side validation,
 * and API submission. Wrapped in RequireAuth (spec §23.3).
 * @spec (spec §19, §19.2, §19.5, §24.2, §24.3)
 */
export function Checkout() {
  const navigate = useNavigate();
  const { clear } = useCart();

  const [checkoutToken, setCheckoutToken] = useState("");
  const [cartData, setCartData] = useState<CheckoutView["cart"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Form values (controlled components)
  const [values, setValues] = useState<Record<string, string>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    paymentMethod: "",
    checkoutToken: "",
  });

  // Per-field errors (client-side validation)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // General errors (server 400 — stock, etc.)
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Fetch checkout data on mount
  useEffect(() => {
    let cancelled = false;

    api
      .get<CheckoutView>("/checkout")
      .then((data) => {
        if (!cancelled) {
          setCheckoutToken(data.checkoutToken);
          setCartData(data.cart);
          setValues((prev) => ({ ...prev, checkoutToken: data.checkoutToken }));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError("No se pudo cargar el checkout.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear per-field error as user types/changes
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FieldErrors];
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setGeneralErrors([]);

      // Client-side validation (mirrors checkout-validation.js, spec §19.5)
      const errors = validateForm(values);
      setFieldErrors(errors);
      const firstInvalid = Object.keys(errors).find((k) => errors[k as keyof FieldErrors]);
      if (firstInvalid) {
        const input = document.querySelector(
          `[name="${firstInvalid}"]`,
        ) as HTMLInputElement | null;
        if (input) input.focus();
        return;
      }

      // Submit
      setSubmitting(true);
      try {
        const data = await api.post<{ confirmationToken: string }>("/checkout", {
          ...values,
          checkoutToken,
        });
        // Clear cart via CartProvider after success (spec §19.2)
        await clear();
        // Navigate to confirmation
        navigate(`/checkout/confirmation/${data.confirmationToken}`);
      } catch (err) {
        if (err instanceof ValidationError) {
          // 400 with field-level errors
          const fe = err.fieldErrors;
          // Check for general errors (array under _general key)
          if (fe._general && Array.isArray(fe._general)) {
            setGeneralErrors(fe._general);
          }
          // Map field errors to per-field slots
          const mapped: FieldErrors = {};
          const fieldNames = [
            "firstName",
            "lastName",
            "email",
            "phone",
            "address",
            "city",
            "postalCode",
            "country",
            "paymentMethod",
          ];
          fieldNames.forEach((f) => {
            const errs = fe[f];
            if (errs && Array.isArray(errs) && errs.length > 0) {
              mapped[f as keyof FieldErrors] = errs[0];
            }
          });
          setFieldErrors(mapped);
        } else {
          setGeneralErrors(["No se pudo completar la compra"]);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [values, checkoutToken, clear, navigate],
  );

  // Empty cart state
  if (!loading && (!cartData || cartData.items.length === 0)) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <a href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-brand">
          ← Volver al carrito
        </a>
        <div
          data-cart-empty
          data-testid="cart-empty"
          className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm"
        >
          <p className="text-muted">Tu carrito está vacío.</p>
          <a href="/" className="btn-primary mt-4 inline-block">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <p className="text-muted">Cargando checkout…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <p className="text-alert">{fetchError}</p>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <a href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-brand">
        ← Volver al carrito
      </a>
      <h1 className="mt-3 text-h3 text-ink">Checkout</h1>

      {/* General errors (stock, network, etc.) */}
      <div
        data-checkout-errors
        className={`mt-4 rounded-2xl border border-alert bg-white p-4 shadow-sm ${generalErrors.length ? "" : "hidden"}`}
        role="alert"
        style={generalErrors.length ? {} : { display: "none" }}
      >
        <h2 className="text-sm font-bold text-alert">Revisá los datos del formulario:</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-alert" data-checkout-errors-list>
          {generalErrors.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <form
          data-checkout-form
          method="POST"
          action="/checkout"
          noValidate
          className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md md:p-6"
          onSubmit={handleSubmit}
        >
          <h2 className="text-h3 text-ink">Datos de envío</h2>

          {/* firstName */}
          <div>
            <label htmlFor="firstName" className="sr-only">Nombre</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Tu nombre"
              autoComplete="given-name"
              value={values.firstName}
              onChange={handleChange}
              className={`h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 ${fieldErrors.firstName ? "border-alert" : ""}`}
              aria-invalid={!!fieldErrors.firstName}
            />
            <p
              data-error-for="firstName"
              className={`text-sm text-alert ${fieldErrors.firstName ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.firstName ? {} : { display: "none" }}
            >
              {fieldErrors.firstName}
            </p>
          </div>

          {/* lastName */}
          <div>
            <label htmlFor="lastName" className="sr-only">Apellido</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Tu apellido"
              autoComplete="family-name"
              value={values.lastName}
              onChange={handleChange}
              className={`h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 ${fieldErrors.lastName ? "border-alert" : ""}`}
              aria-invalid={!!fieldErrors.lastName}
            />
            <p
              data-error-for="lastName"
              className={`text-sm text-alert ${fieldErrors.lastName ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.lastName ? {} : { display: "none" }}
            >
              {fieldErrors.lastName}
            </p>
          </div>

          {/* email */}
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Tu email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              className={`h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 ${fieldErrors.email ? "border-alert" : ""}`}
              aria-invalid={!!fieldErrors.email}
            />
            <p
              data-error-for="email"
              className={`text-sm text-alert ${fieldErrors.email ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.email ? {} : { display: "none" }}
            >
              {fieldErrors.email}
            </p>
          </div>

          {/* phone */}
          <div>
            <label htmlFor="phone" className="sr-only">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Tu teléfono"
              autoComplete="tel"
              value={values.phone}
              onChange={handleChange}
              className={`h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 ${fieldErrors.phone ? "border-alert" : ""}`}
              aria-invalid={!!fieldErrors.phone}
            />
            <p
              data-error-for="phone"
              className={`text-sm text-alert ${fieldErrors.phone ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.phone ? {} : { display: "none" }}
            >
              {fieldErrors.phone}
            </p>
          </div>

          {/* address */}
          <div>
            <label htmlFor="address" className="sr-only">Dirección</label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="Tu dirección"
              autoComplete="street-address"
              value={values.address}
              onChange={handleChange}
              className={`h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 ${fieldErrors.address ? "border-alert" : ""}`}
              aria-invalid={!!fieldErrors.address}
            />
            <p
              data-error-for="address"
              className={`text-sm text-alert ${fieldErrors.address ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.address ? {} : { display: "none" }}
            >
              {fieldErrors.address}
            </p>
          </div>

          {/* city */}
          <div>
            <label htmlFor="city" className="sr-only">Ciudad</label>
            <input
              id="city"
              name="city"
              type="text"
              placeholder="Tu ciudad"
              autoComplete="address-level2"
              value={values.city}
              onChange={handleChange}
              className={`h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 ${fieldErrors.city ? "border-alert" : ""}`}
              aria-invalid={!!fieldErrors.city}
            />
            <p
              data-error-for="city"
              className={`text-sm text-alert ${fieldErrors.city ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.city ? {} : { display: "none" }}
            >
              {fieldErrors.city}
            </p>
          </div>

          {/* postalCode */}
          <div>
            <label htmlFor="postalCode" className="sr-only">Código postal</label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              placeholder="Tu código postal"
              autoComplete="postal-code"
              value={values.postalCode}
              onChange={handleChange}
              className={`h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 ${fieldErrors.postalCode ? "border-alert" : ""}`}
              aria-invalid={!!fieldErrors.postalCode}
            />
            <p
              data-error-for="postalCode"
              className={`text-sm text-alert ${fieldErrors.postalCode ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.postalCode ? {} : { display: "none" }}
            >
              {fieldErrors.postalCode}
            </p>
          </div>

          {/* country */}
          <div>
            <label htmlFor="country" className="sr-only">País</label>
            <input
              id="country"
              name="country"
              type="text"
              placeholder="Tu país"
              autoComplete="country-name"
              value={values.country}
              onChange={handleChange}
              className={`h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 ${fieldErrors.country ? "border-alert" : ""}`}
              aria-invalid={!!fieldErrors.country}
            />
            <p
              data-error-for="country"
              className={`text-sm text-alert ${fieldErrors.country ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.country ? {} : { display: "none" }}
            >
              {fieldErrors.country}
            </p>
          </div>

          <h2 className="mt-2 text-h3 text-ink">Método de pago</h2>

          <div>
            <label htmlFor="paymentMethod" className="sr-only">Método de pago</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={values.paymentMethod}
              onChange={handleChange}
              className="h-10 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              aria-invalid={!!fieldErrors.paymentMethod}
            >
              <option value="" disabled>Seleccioná un método de pago</option>
              <option value="transfer">Transferencia</option>
              <option value="cash_on_delivery">Pago contra entrega</option>
              <option value="card">Tarjeta</option>
            </select>
            <p
              data-error-for="paymentMethod"
              className={`text-sm text-alert ${fieldErrors.paymentMethod ? "" : "hidden"}`}
              role="alert"
              style={fieldErrors.paymentMethod ? {} : { display: "none" }}
            >
              {fieldErrors.paymentMethod}
            </p>
          </div>

          <input type="hidden" name="checkoutToken" value={checkoutToken} />

          <button
            type="submit"
            data-checkout-submit
            className="btn-primary mt-2 w-full"
            disabled={submitting}
          >
            {submitting ? "Procesando…" : "Confirmar compra"}
          </button>
        </form>

        {/* Cart summary */}
        <aside aria-label="Resumen de compra" className="h-fit rounded-2xl bg-white p-5 shadow-md md:p-6">
          <h2 className="text-h3 text-ink">Resumen</h2>
          <ul className="mt-4 flex flex-col gap-3" data-checkout-summary>
            {cartData!.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="text-ink">
                  {item.name}
                  <span className="text-muted"> × {item.quantity}</span>
                </span>
                <span className="font-medium text-ink">
                  {item.subtotal.toLocaleString("es-AR")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
            <span className="text-ink">Total</span>
            <span className="text-xl font-bold text-ink" data-checkout-total>
              {cartData!.total.toLocaleString("es-AR")}
            </span>
          </p>
        </aside>
      </div>
    </section>
  );
}

/**
 * Wrapped checkout route — requires authentication (spec §23.3).
 * @spec (spec §19, §23.3)
 */
export function CheckoutPage() {
  return (
    <RequireAuth>
      <Checkout />
    </RequireAuth>
  );
}

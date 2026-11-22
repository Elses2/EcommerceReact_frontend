/**
 * CartProvider — Context + state + actions for the shopping cart.
 *
 * Replaces the monolith `cart.js` (spec §6.4/§24). Syncs from the server:
 *   - Fetches `GET /api/cart` on mount when authenticated.
 *   - After each mutation, the server response becomes the new state
 *     (no optimistic math drift — spec handoff for T14).
 *
 * Pending-intention flow (spec §24.3 / issue #3):
 *   - When `add` receives 401 (guest / expired session), the intention
 *     `{ productId, quantity, next }` is persisted to `sessionStorage`
 *     under key `pending_cart_add` and the UI is NOT crashed.
 *   - When auth transitions guest → authenticated (login/register),
 *     the pending intention is consumed: the add is retried and storage
 *     is cleared.
 *
 * @spec (spec §24.2, §24.3, §5)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import {
  api,
  type UnauthorizedError,
  configureApiClient,
} from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One line in the cart — mirrors backend `CartItemView` (spec §24). */
export interface CartItemView {
  productId: number;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  subtotal: number;
}

/** Full cart view returned by every cart endpoint (spec §24). */
export interface CartView {
  items: CartItemView[];
  total: number;
  count: number;
}

/** Internal state shape for the cart context. */
interface CartState {
  items: CartItemView[];
  total: number;
  count: number;
}

/** Pending add-to-cart intention stored in sessionStorage (spec §24.3). */
export interface PendingCartAdd {
  productId: number;
  quantity: number;
  next: string;
}

interface CartContextType {
  cart: CartState;
  status: "loading" | "ready";
  add: (productId: number, quantity?: number) => Promise<void>;
  increase: (productId: number) => Promise<void>;
  decrease: (productId: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const PENDING_KEY = "pending_cart_add";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadPending(): PendingCartAdd | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCartAdd;
    if (
      typeof parsed.productId === "number" &&
      typeof parsed.quantity === "number" &&
      typeof parsed.next === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function savePending(intention: PendingCartAdd): void {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(intention));
  } catch {
    /* storage unavailable — intention is lost */
  }
}

function clearPending(): void {
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* storage unavailable */
  }
}

function isUnauthorized(err: unknown): err is UnauthorizedError {
  return err instanceof Error && err.name === "UnauthorizedError";
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CartProviderProps {
  children: React.ReactNode;
}

/**
 * CartProvider — provides cart state and mutation actions.
 * Fetches `GET /api/cart` on auth resolution and after every mutation.
 * @param props - CartProviderProps
 * @spec (spec §24.2, §24.3)
 */
export function CartProvider({ children }: CartProviderProps) {
  const { status: authStatus } = useAuth();

  const [cart, setCart] = useState<CartState>({
    items: [],
    total: 0,
    count: 0,
  });
  const [cartStatus, setCartStatus] = useState<"loading" | "ready">("loading");

  // Track the previous auth status to detect transitions.
  const prevAuthStatus = useRef(authStatus);

  // Configure a no-op unauthorized handler so CartProvider can catch
  // 401s without the default window.location redirect racing us.
  useEffect(() => {
    configureApiClient(() => {
      /* no-op — CartProvider catches UnauthorizedError itself */
    });
  }, []);

  // Fetch cart from server when authenticated.
  useEffect(() => {
    let cancelled = false;

    if (authStatus === "authenticated") {
      setCartStatus("loading");
      api
        .get<CartView>("/cart")
        .then((data) => {
          if (!cancelled) {
            setCart({ items: data.items, total: data.total, count: data.count });
            setCartStatus("ready");
          }
        })
        .catch(() => {
          if (!cancelled) {
            // 401 or network — stay with empty cart, ready state.
            setCartStatus("ready");
          }
        });
    } else {
      setCart({ items: [], total: 0, count: 0 });
      setCartStatus("ready");
    }

    // NOTA: prevAuthStatus NO se toca acá — el efecto consumidor (que corre
    // después en el mismo ciclo) necesita leer el valor PREVIO a esta
    // transición para detectarla (montaje fresco ya autenticado incluido).
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  // Pending-intention consumer: cuando la sesión pasa a autenticada venga de
  // donde venga (login SPA o recarga completa ya con cookie — el monolito
  // consume al cargar, spec §24.3), consume cualquier intención pendiente.
  useEffect(() => {
    const wasAuthenticated = prevAuthStatus.current === "authenticated";
    const isNowAuthenticated = authStatus === "authenticated";

    if (isNowAuthenticated && !wasAuthenticated) {

    const pending = loadPending();
    if (!pending) return;

    // Consume the intention: retry the add, then clear storage.
    api
      .post<CartView>(`/cart/add/${pending.productId}`)
      .then((data) => {
        setCart({ items: data.items, total: data.total, count: data.count });
        clearPending();
      })
      .catch(() => {
        /* still not authenticated or network — leave intention in storage */
      });
  }

  // El ref se sincroniza al FINAL de este efecto (después de leerlo), de
  // modo que la próxima transición se detecte correctamente.
  prevAuthStatus.current = authStatus;
  }, [authStatus]);

  /**
   * Add a product to the cart (spec §24.2, POST /api/cart/add/:productId).
   * On 401 the add is deferred: `{ productId, quantity, next }` is persisted
   * to sessionStorage and the caller is redirected to login. The UI is NOT
   * crashed (spec §24.3 / issue #3).
   * @param productId - numeric product id
   * @param quantity - optional quantity for future extension (endpoint adds 1)
   * @spec (spec §24.2, §24.3)
   */
  const add = useCallback(
    async (productId: number, quantity?: number) => {
      try {
        const data = await api.post<CartView>(`/cart/add/${productId}`);
        setCart({ items: data.items, total: data.total, count: data.count });
      } catch (err) {
        if (isUnauthorized(err)) {
          const next = window.location.pathname + window.location.search;
          savePending({
            productId,
            quantity: quantity ?? 1,
            next,
          });
          window.location.href = `/login?next=${encodeURIComponent(next)}&reason=cart`;
          return;
        }
        throw err;
      }
    },
    [],
  );

  /**
   * Increment quantity by one (spec §24.2, PATCH /api/cart/increase/:productId).
   * @spec (spec §24.2)
   */
  const increase = useCallback(async (productId: number) => {
    const data = await api.patch<CartView>(`/cart/increase/${productId}`);
    setCart({ items: data.items, total: data.total, count: data.count });
  }, []);

  /**
   * Decrement quantity by one (spec §24.2, PATCH /api/cart/decrease/:productId).
   * @spec (spec §24.2)
   */
  const decrease = useCallback(async (productId: number) => {
    const data = await api.patch<CartView>(`/cart/decrease/${productId}`);
    setCart({ items: data.items, total: data.total, count: data.count });
  }, []);

  /**
   * Remove a product from the cart (spec §24.2, DELETE /api/cart/remove/:productId).
   * @spec (spec §24.2)
   */
  const remove = useCallback(async (productId: number) => {
    const data = await api.delete<CartView>(`/cart/remove/${productId}`);
    setCart({ items: data.items, total: data.total, count: data.count });
  }, []);

  /**
   * Clear the entire cart (spec §24.2, DELETE /api/cart/clear).
   * @spec (spec §24.2)
   */
  const clear = useCallback(async () => {
    const data = await api.delete<CartView>("/cart/clear");
    setCart({ items: data.items, total: data.total, count: data.count });
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart: { items: cart.items, total: cart.total, count: cart.count },
        status: cartStatus,
        add,
        increase,
        decrease,
        remove,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to access the cart context. Must be used within a `CartProvider`.
 * @returns CartContextType with `cart`, `status`, and mutation actions
 * @spec (spec §24.2, §24.3)
 */
export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

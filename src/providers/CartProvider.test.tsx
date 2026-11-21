/**
 * Unit tests for CartProvider (`src/providers/CartProvider.tsx`).
 *
 * Mocks the API client (`../lib/api`) — no network calls in tests.
 * Uses module-level mock for `../lib/api` so `api.get/post/patch/delete`
 * are spy functions that can be individually configured per test.
 *
 * @spec (spec §24.2, §24.3, §5)
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useAuth } from "../providers/AuthProvider";
import { CartProvider, useCart } from "./CartProvider";
import { UnauthorizedError, api } from "../lib/api";

vi.mock("../providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    configureApiClient: vi.fn(),
  };
});

const mockApi = api as any;


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(
  status: "loading" | "authenticated" | "guest" = "authenticated",
) {
  return {
    user:
      status === "authenticated"
        ? { id: 1, name: "Alice", email: "alice@example.com", role: "customer" }
        : null,
    status,
    logout: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  };
}

function CartTestWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

// ---------------------------------------------------------------------------
// Fetch on mount
// ---------------------------------------------------------------------------

describe("CartProvider — fetch on mount (spec §24.3)", () => {
  it("calls GET /api/cart when authenticated and syncs state from response", async () => {
    mockApi.get.mockResolvedValue({
      items: [
        {
          productId: 1,
          quantity: 2,
          name: "Widget",
          price: 15,
          imageUrl: "/widget.jpg",
          inStock: true,
          subtotal: 30,
        },
      ],
      total: 30,
      count: 2,
    });
    vi.mocked(useAuth).mockReturnValue(makeContext("authenticated"));

    render(
      <CartTestWrapper>
        <Consumer />
      </CartTestWrapper>,
    );

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/cart");
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("ready");
    });
    expect(screen.getByTestId("total")).toHaveTextContent("30");
    expect(screen.getByTestId("items")).toHaveTextContent("1");
  });

  it("resets cart when auth becomes guest", async () => {
    mockApi.get.mockResolvedValue({
      items: [],
      total: 0,
      count: 0,
    });
    vi.mocked(useAuth).mockReturnValue(makeContext("authenticated"));

    const { rerender } = render(
      <CartTestWrapper>
        <Consumer />
      </CartTestWrapper>,
    );

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/cart");
    });
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("ready");
    });

    vi.mocked(useAuth).mockReturnValue(makeContext("guest"));
    rerender(
      <CartTestWrapper>
        <Consumer />
      </CartTestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("total")).toHaveTextContent("0");
    });
  });
});

function Consumer() {
  const { cart, status } = useCart();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="total">{cart.total}</span>
      <span data-testid="items">{cart.items.length}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions hit the right endpoints
// ---------------------------------------------------------------------------

describe("CartProvider — actions hit right endpoints (spec §24.2)", () => {
  it("add calls POST /api/cart/add/:productId and updates state from response", async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, count: 0 });
    mockApi.post.mockResolvedValue({
      items: [
        {
          productId: 42,
          quantity: 1,
          name: "Gadget",
          price: 99,
          imageUrl: "",
          inStock: true,
          subtotal: 99,
        },
      ],
      total: 99,
      count: 1,
    });
    vi.mocked(useAuth).mockReturnValue(makeContext("authenticated"));

    render(
      <CartTestWrapper>
        <ActionTester />
      </CartTestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("add-btn")).toBeInTheDocument();
    });

    await act(async () => {
      await screen.getByTestId("add-btn").click();
    });

    expect(mockApi.post).toHaveBeenCalledWith("/cart/add/42");
    await waitFor(() => {
      expect(screen.getByTestId("total")).toHaveTextContent("99");
    });
  });

  it("increase calls PATCH /api/cart/increase/:productId", async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, count: 0 });
    mockApi.patch.mockResolvedValue({
      items: [
        {
          productId: 7,
          quantity: 3,
          name: "Thing",
          price: 10,
          imageUrl: "",
          inStock: true,
          subtotal: 30,
        },
      ],
      total: 30,
      count: 3,
    });
    vi.mocked(useAuth).mockReturnValue(makeContext("authenticated"));

    render(
      <CartTestWrapper>
        <IncTester />
      </CartTestWrapper>,
    );

    await act(async () => {
      await screen.getByTestId("inc-btn").click();
    });

    expect(mockApi.patch).toHaveBeenCalledWith("/cart/increase/7");
    await waitFor(() => {
      expect(screen.getByTestId("total")).toHaveTextContent("30");
    });
  });

  it("decrease calls PATCH /api/cart/decrease/:productId", async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, count: 0 });
    mockApi.patch.mockResolvedValue({
      items: [
        {
          productId: 7,
          quantity: 1,
          name: "Thing",
          price: 10,
          imageUrl: "",
          inStock: true,
          subtotal: 10,
        },
      ],
      total: 10,
      count: 1,
    });
    vi.mocked(useAuth).mockReturnValue(makeContext("authenticated"));

    render(
      <CartTestWrapper>
        <DecTester />
      </CartTestWrapper>,
    );

    await act(async () => {
      await screen.getByTestId("dec-btn").click();
    });

    expect(mockApi.patch).toHaveBeenCalledWith("/cart/decrease/7");
    await waitFor(() => {
      expect(screen.getByTestId("total")).toHaveTextContent("10");
    });
  });

  it("remove calls DELETE /api/cart/remove/:productId", async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, count: 0 });
    mockApi.delete.mockResolvedValue({
      items: [],
      total: 0,
      count: 0,
    });
    vi.mocked(useAuth).mockReturnValue(makeContext("authenticated"));

    render(
      <CartTestWrapper>
        <RemTester />
      </CartTestWrapper>,
    );

    await act(async () => {
      await screen.getByTestId("rem-btn").click();
    });

    expect(mockApi.delete).toHaveBeenCalledWith("/cart/remove/99");
    await waitFor(() => {
      expect(screen.getByTestId("total")).toHaveTextContent("0");
    });
  });

  it("clear calls DELETE /api/cart/clear", async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, count: 0 });
    mockApi.delete.mockResolvedValue({
      items: [],
      total: 0,
      count: 0,
    });
    vi.mocked(useAuth).mockReturnValue(makeContext("authenticated"));

    render(
      <CartTestWrapper>
        <ClearTester />
      </CartTestWrapper>,
    );

    await act(async () => {
      await screen.getByTestId("clear-btn").click();
    });

    expect(mockApi.delete).toHaveBeenCalledWith("/cart/clear");
    await waitFor(() => {
      expect(screen.getByTestId("total")).toHaveTextContent("0");
    });
  });
});

function ActionTester() {
  const { add } = useCart();
  const { cart } = useCart();
  return (
    <div>
      <span data-testid="total">{cart.total}</span>
      <button data-testid="add-btn" onClick={() => add(42)}>
        Add
      </button>
    </div>
  );
}
function IncTester() {
  const { increase, cart } = useCart();
  return (
    <div>
      <span data-testid="total">{cart.total}</span>
      <button data-testid="inc-btn" onClick={() => increase(7)}>
        Inc
      </button>
    </div>
  );
}
function DecTester() {
  const { decrease, cart } = useCart();
  return (
    <div>
      <span data-testid="total">{cart.total}</span>
      <button data-testid="dec-btn" onClick={() => decrease(7)}>
        Dec
      </button>
    </div>
  );
}
function RemTester() {
  const { remove, cart } = useCart();
  return (
    <div>
      <span data-testid="total">{cart.total}</span>
      <button data-testid="rem-btn" onClick={() => remove(99)}>
        Rem
      </button>
    </div>
  );
}
function ClearTester() {
  const { clear, cart } = useCart();
  return (
    <div>
      <span data-testid="total">{cart.total}</span>
      <button data-testid="clear-btn" onClick={clear}>
        Clear
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 401 → pending intention
// ---------------------------------------------------------------------------

describe("CartProvider — 401 → pending intention (spec §24.3)", () => {
  it("saves intention to sessionStorage and does NOT crash the UI on add 401", async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, count: 0 });
    mockApi.post.mockRejectedValue(
      new UnauthorizedError("Authentication required"),
    );
    vi.mocked(useAuth).mockReturnValue(makeContext("guest"));

    render(
      <CartTestWrapper>
        <ActionTester />
      </CartTestWrapper>,
    );

    // Clicking add should NOT throw
    await act(async () => {
      await screen.getByTestId("add-btn").click();
    });

    // Intention saved in sessionStorage
    const pending = window.sessionStorage.getItem("pending_cart_add");
    expect(pending).not.toBeNull();
    const parsed = JSON.parse(pending!);
    expect(parsed.productId).toBe(42);
    expect(parsed.quantity).toBe(1);
    expect(parsed.next).toBeDefined();
  });

  it("does NOT save intention for non-401 errors", async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, count: 0 });
    mockApi.post.mockRejectedValue(new Error("Network error"));
    vi.mocked(useAuth).mockReturnValue(makeContext("authenticated"));

    render(
      <CartTestWrapper>
        <ActionTester />
      </CartTestWrapper>,
    );

    // Network errors propagate through act — catch to avoid unhandled rejection
    try {
      await act(async () => {
        await screen.getByTestId("add-btn").click();
      });
    } catch {
      // Expected — non-401 errors propagate
    }

    // The error propagated — no intention saved
    expect(window.sessionStorage.getItem("pending_cart_add")).toBeNull();
  });
});



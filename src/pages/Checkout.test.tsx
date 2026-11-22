/**
 * Unit tests for the /checkout page (`src/pages/Checkout.tsx`).
 *
 * Mocks the API client (`../lib/api`) and `useCart`
 * (`../providers/CartProvider`) — no network calls in tests.
 * Uses `getByAttribute` from `../test-helpers` for data-*
 * attribute queries per the existing test conventions.
 * Uses `userEvent` from `@testing-library/user-event` for
 * form interactions (matching SearchBar.test.tsx pattern).
 *
 * @spec (spec §19, §19.2, §19.5, §24.2, §24.3, §5)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getByAttribute } from "../test-helpers";
import { Checkout } from "./Checkout";
import { api, ValidationError } from "../lib/api";
import { useCart } from "../providers/CartProvider";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ValidationError: class ValidationError extends Error {
    constructor(
      public readonly message: string,
      public readonly fieldErrors: Record<string, string[] | undefined>,
    ) {
      super(message);
      this.name = "ValidationError";
    }
  },
}));

vi.mock("../providers/CartProvider", () => ({
  useCart: vi.fn(),
}));

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockUseCart = vi.mocked(useCart);

beforeEach(() => {
  vi.clearAllMocks();
});

function setupCart(cartState: {
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
}) {
  mockUseCart.mockReturnValue({
    cart: cartState,
    status: "ready" as const,
    add: vi.fn(),
    increase: vi.fn(),
    decrease: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  });
}

const mockCheckoutView = {
  checkoutToken: "a".repeat(32),
  cart: {
    items: [
      {
        productId: 1,
        quantity: 2,
        name: "Widget",
        price: 10,
        imageUrl: "/widget.jpg",
        inStock: true,
        subtotal: 20,
      },
    ],
    total: 20,
    count: 2,
  },
};

// Helper to wait for the loading state to resolve
async function waitForLoadingToFinish() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("Checkout page (spec §19, §19.5)", () => {
  it("renders empty-cart state when cart has no items", async () => {
    setupCart({ items: [], total: 0, count: 0 });
    mockApiGet.mockResolvedValue({
      ...mockCheckoutView,
      cart: { items: [], total: 0, count: 0 },
    });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await waitForLoadingToFinish();

    expect(screen.getByTestId("cart-empty")).toBeInTheDocument();
  });

  it("shows per-field validation errors on invalid submit", async () => {
    setupCart(mockCheckoutView.cart);
    mockApiGet.mockResolvedValue(mockCheckoutView);

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await waitForLoadingToFinish();

    const user = userEvent.setup();
    const submitBtn = screen.getByRole("button", { name: /confirmar compra/i });
    await act(async () => {
      await user.click(submitBtn);
    });

    // Per-field errors should appear
    expect(getByAttribute("data-error-for", "firstName")).not.toHaveClass("hidden");
    expect(getByAttribute("data-error-for", "lastName")).not.toHaveClass("hidden");
    expect(getByAttribute("data-error-for", "email")).not.toHaveClass("hidden");
    expect(getByAttribute("data-error-for", "phone")).not.toHaveClass("hidden");
    expect(getByAttribute("data-error-for", "address")).not.toHaveClass("hidden");
    expect(getByAttribute("data-error-for", "city")).not.toHaveClass("hidden");
    expect(getByAttribute("data-error-for", "postalCode")).not.toHaveClass("hidden");
    expect(getByAttribute("data-error-for", "country")).not.toHaveClass("hidden");
    expect(getByAttribute("data-error-for", "paymentMethod")).not.toHaveClass("hidden");
  });

  it("shows email format error for invalid email", async () => {
    setupCart(mockCheckoutView.cart);
    mockApiGet.mockResolvedValue(mockCheckoutView);

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await waitForLoadingToFinish();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "not-an-email");

    const submitBtn = screen.getByRole("button", { name: /confirmar compra/i });
    await act(async () => {
      await user.click(submitBtn);
    });

    const emailError = getByAttribute("data-error-for", "email");
    expect(emailError).not.toHaveClass("hidden");
    expect(emailError).toHaveTextContent("Ingresá un email válido");
  });

  it("shows phone digits error for invalid phone", async () => {
    setupCart(mockCheckoutView.cart);
    mockApiGet.mockResolvedValue(mockCheckoutView);

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await waitForLoadingToFinish();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Teléfono"), "123");

    const submitBtn = screen.getByRole("button", { name: /confirmar compra/i });
    await act(async () => {
      await user.click(submitBtn);
    });

    const phoneError = getByAttribute("data-error-for", "phone");
    expect(phoneError).not.toHaveClass("hidden");
    expect(phoneError).toHaveTextContent("7 y 15 dígitos");
  });

  it("shows general errors from 400 response (stock errors etc.)", async () => {
    setupCart(mockCheckoutView.cart);
    mockApiGet.mockResolvedValue(mockCheckoutView);
    mockApiPost.mockRejectedValue(
      new ValidationError(
        "Validation failed",
        { _general: ["No hay stock suficiente para el producto"] },
      )
    );

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await waitForLoadingToFinish();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@example.com");
    await user.type(screen.getByLabelText("Teléfono"), "12345678");
    await user.type(screen.getByLabelText("Dirección"), "Calle Falsa 123");
    await user.type(screen.getByLabelText("Ciudad"), "Buenos Aires");
    await user.type(screen.getByLabelText("Código postal"), "C1000");
    await user.type(screen.getByLabelText("País"), "Argentina");
    await user.selectOptions(screen.getByRole("combobox"), "transfer");

    const submitBtn = screen.getByRole("button", { name: /confirmar compra/i });
    await act(async () => {
      await user.click(submitBtn);
    });

    const errorBox = getByAttribute("data-checkout-errors");
    expect(errorBox).not.toHaveStyle("display: none");
    expect(errorBox).toHaveTextContent("No hay stock suficiente para el producto");
  });

  it("shows per-field errors from 400 response", async () => {
    setupCart(mockCheckoutView.cart);
    mockApiGet.mockResolvedValue(mockCheckoutView);
    mockApiPost.mockRejectedValue(
      new ValidationError(
        "Validation failed",
        { email: ["El email es obligatorio."] },
      )
    );

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await waitForLoadingToFinish();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@example.com");
    await user.type(screen.getByLabelText("Teléfono"), "12345678");
    await user.type(screen.getByLabelText("Dirección"), "Calle Falsa 123");
    await user.type(screen.getByLabelText("Ciudad"), "Buenos Aires");
    await user.type(screen.getByLabelText("Código postal"), "C1000");
    await user.type(screen.getByLabelText("País"), "Argentina");
    await user.selectOptions(screen.getByRole("combobox"), "transfer");

    const submitBtn = screen.getByRole("button", { name: /confirmar compra/i });
    await act(async () => {
      await user.click(submitBtn);
    });

    const emailError = getByAttribute("data-error-for", "email");
    expect(emailError).not.toHaveClass("hidden");
    expect(emailError).toHaveTextContent("El email es obligatorio.");
  });

  it("successful submit navigates to confirmation page", async () => {
    setupCart(mockCheckoutView.cart);
    mockApiGet.mockResolvedValue(mockCheckoutView);
    mockApiPost.mockResolvedValue({ confirmationToken: "confirm-abc-123" });

    render(
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/confirmation/:token" element={<RouterPathProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitForLoadingToFinish();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@example.com");
    await user.type(screen.getByLabelText("Teléfono"), "12345678");
    await user.type(screen.getByLabelText("Dirección"), "Calle Falsa 123");
    await user.type(screen.getByLabelText("Ciudad"), "Buenos Aires");
    await user.type(screen.getByLabelText("Código postal"), "C1000");
    await user.type(screen.getByLabelText("País"), "Argentina");
    await user.selectOptions(screen.getByRole("combobox"), "transfer");

    const submitBtn = screen.getByRole("button", { name: /confirmar compra/i });
    await act(async () => {
      await user.click(submitBtn);
    });

    // After successful submit, should navigate to confirmation.
    // MemoryRouter no toca window.location: se observa la location real del
    // router con un sondeo dentro del árbol (useLocation).
    expect(await screen.findByTestId("router-path")).toHaveTextContent(
      "/checkout/confirmation/confirm-abc-123",
    );
  });
});

/**
 * Renderiza la ruta actual del router como texto — utilidad para afirmar
 * navegaciones bajo MemoryRouter en los tests.
 */
function RouterPathProbe() {
  const location = useLocation();
  return <span data-testid="router-path">{location.pathname}</span>;
}

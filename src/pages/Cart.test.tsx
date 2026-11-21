/**
 * Unit tests for the /cart page (`src/pages/Cart.tsx`).
 * Verifies that items render with the correct `data-*` attributes,
 * quantity controls fire the right actions, and the empty state
 * is shown when the cart is empty.
 *
 * @spec (spec §4.2, §5)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useCart } from "../providers/CartProvider";
import { Cart } from "./Cart";
import { MemoryRouter } from "react-router-dom";

vi.mock("../providers/CartProvider", () => ({
  useCart: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const mockUseCart = vi.mocked(useCart);

function setup(cartState: {
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

describe("Cart page (spec §4.2)", () => {
  it("renders empty-cart state when count is 0", () => {
    setup({ items: [], total: 0, count: 0 });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("cart-empty")).toBeInTheDocument();
    const summary = screen.getByTestId("cart-summary");
    expect(summary).toHaveStyle("display: none");
  });

  it("renders items with data-cart-item attribute", () => {
    setup({
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
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    const row = screen.getByTestId("cart-item-1");
    expect(row).toBeInTheDocument();
    expect(row).toHaveAttribute("data-cart-item", "1");
  });

  it("renders total with data-cart-total", () => {
    setup({
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
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("cart-total")).toHaveTextContent("20");
  });

  it("renders clear button with data-cart-action=\"clear\"", () => {
    setup({
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
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    const clearBtn = screen.getByRole("button", { name: /vaciar carrito/i });
    expect(clearBtn).toHaveAttribute("data-cart-action", "clear");
  });

  it("fires increase action when the + button is clicked", async () => {
    const increase = vi.fn();
    mockUseCart.mockReturnValue({
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
      status: "ready",
      add: vi.fn(),
      increase,
      decrease: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    const incBtn = screen.getByRole("button", { name: /aumentar cantidad/i });
    await incBtn.click();
    expect(increase).toHaveBeenCalledWith(1);
  });

  it("fires decrease action when the − button is clicked", async () => {
    const decrease = vi.fn();
    mockUseCart.mockReturnValue({
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
      status: "ready",
      add: vi.fn(),
      increase: vi.fn(),
      decrease,
      remove: vi.fn(),
      clear: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    const decBtn = screen.getByRole("button", { name: /reducir cantidad/i });
    await decBtn.click();
    expect(decrease).toHaveBeenCalledWith(1);
  });

  it("fires remove action when the Quitar button is clicked", async () => {
    const remove = vi.fn();
    mockUseCart.mockReturnValue({
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
      status: "ready",
      add: vi.fn(),
      increase: vi.fn(),
      decrease: vi.fn(),
      remove,
      clear: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    const remBtn = screen.getByRole("button", { name: /quitar widget del carrito/i });
    await remBtn.click();
    expect(remove).toHaveBeenCalledWith(1);
  });

  it("renders checkout CTA link to /checkout", () => {
    setup({
      items: [
        {
          productId: 1,
          quantity: 1,
          name: "Widget",
          price: 10,
          imageUrl: "/widget.jpg",
          inStock: true,
          subtotal: 10,
        },
      ],
      total: 10,
      count: 1,
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    const checkoutLink = screen.getByRole("link", { name: /ir a pagar/i });
    expect(checkoutLink).toHaveAttribute("href", "/checkout");
  });

  it("preserves data-cart-action=\"increase\" and data-product-id on Numeric", () => {
    setup({
      items: [
        {
          productId: 42,
          quantity: 3,
          name: "Gadget",
          price: 10,
          imageUrl: "/gadget.jpg",
          inStock: true,
          subtotal: 30,
        },
      ],
      total: 30,
      count: 3,
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    const incBtn = screen.getByRole("button", { name: /aumentar cantidad/i });
    expect(incBtn).toHaveAttribute("data-cart-action", "increase");
    expect(incBtn).toHaveAttribute("data-product-id", "42");
  });

  it("preserves data-cart-action=\"decrease\" and data-product-id on Numeric", () => {
    setup({
      items: [
        {
          productId: 42,
          quantity: 3,
          name: "Gadget",
          price: 10,
          imageUrl: "/gadget.jpg",
          inStock: true,
          subtotal: 30,
        },
      ],
      total: 30,
      count: 3,
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    const decBtn = screen.getByRole("button", { name: /reducir cantidad/i });
    expect(decBtn).toHaveAttribute("data-cart-action", "decrease");
    expect(decBtn).toHaveAttribute("data-product-id", "42");
  });

  it("renders data-subtotal on each item's subtotal span", () => {
    setup({
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
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("subtotal-1")).toHaveTextContent("20");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useCart } from "../providers/CartProvider";
import { Layout } from "./Layout";

vi.mock("../providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../providers/CartProvider", () => ({
  useCart: vi.fn(),
}));

vi.mock("../organisms/CategoryNav", () => ({
  CategoryNav: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Layout (spec §5 data-logged-in contract)", () => {
  it("renders data-logged-in=\"true\" when auth status is authenticated", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, name: "Alice", email: "alice@example.com", role: "customer" },
      status: "authenticated",
      logout: vi.fn(),
    });
    (useCart as ReturnType<typeof vi.fn>).mockReturnValue({
      cart: { items: [], total: 0, count: 3 },
      status: "ready",
      add: vi.fn(),
      increase: vi.fn(),
      decrease: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>Page content</div>
        </Layout>
      </MemoryRouter>,
    );
    const root = document.querySelector("[data-logged-in]");
    expect(root).toBeInTheDocument();
    expect(root!).toHaveAttribute("data-logged-in", "true");
  });

  it("renders data-logged-in=\"false\" when auth status is guest", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      status: "guest",
      logout: vi.fn(),
    });
    (useCart as ReturnType<typeof vi.fn>).mockReturnValue({
      cart: { items: [], total: 0, count: 0 },
      status: "ready",
      add: vi.fn(),
      increase: vi.fn(),
      decrease: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>Page content</div>
        </Layout>
      </MemoryRouter>,
    );
    const root = document.querySelector("[data-logged-in]");
    expect(root).toBeInTheDocument();
    expect(root!).toHaveAttribute("data-logged-in", "false");
  });

  it("omits data-logged-in entirely while auth status is loading (S13 contract)", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      status: "loading",
      logout: vi.fn(),
    });
    (useCart as ReturnType<typeof vi.fn>).mockReturnValue({
      cart: { items: [], total: 0, count: 0 },
      status: "loading",
      add: vi.fn(),
      increase: vi.fn(),
      decrease: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>Page content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(document.querySelector("[data-logged-in]")).not.toBeInTheDocument();
  });

  it("renders children inside main", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      status: "guest",
      logout: vi.fn(),
    });
    (useCart as ReturnType<typeof vi.fn>).mockReturnValue({
      cart: { items: [], total: 0, count: 0 },
      status: "ready",
      add: vi.fn(),
      increase: vi.fn(),
      decrease: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>Page content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("passes real cart count from CartProvider to Header (spec §24.3)", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, name: "Alice", email: "alice@example.com", role: "customer" },
      status: "authenticated",
      logout: vi.fn(),
    });
    (useCart as ReturnType<typeof vi.fn>).mockReturnValue({
      cart: { items: [{ productId: 1, quantity: 2, name: "Test", price: 10, imageUrl: "", inStock: true, subtotal: 20 }], total: 20, count: 2 },
      status: "ready",
      add: vi.fn(),
      increase: vi.fn(),
      decrease: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>Page content</div>
        </Layout>
      </MemoryRouter>,
    );
    const badge = document.querySelector("[data-cart-count]");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-cart-count", "2");
  });
});

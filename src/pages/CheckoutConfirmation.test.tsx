/**
 * Unit tests for the /checkout/confirmation/:token page
 * (`src/pages/CheckoutConfirmation.tsx`).
 *
 * Mocks the API client (`../lib/api`) — no network calls in tests.
 * Uses `getByAttribute` from `../test-helpers` for data-*
 * attribute queries per the existing test conventions.
 *
 * @spec (spec §19/D7, §27.2)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutConfirmation } from "./CheckoutConfirmation";
import { api } from "../lib/api";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockApiGet = vi.mocked(api.get);

beforeEach(() => {
  vi.clearAllMocks();
});

const mockConfirmationView = {
  order: {
    id: 42,
    total: 29.99,
    status: "pending",
    created_at: "2026-11-21 10:30:00",
  },
  items: [
    {
      product_name: "Producto Confirm",
      quantity: 1,
      unit_price: 29.99,
    },
  ],
};

describe("CheckoutConfirmation (spec §19/D7, §27.2)", () => {
  it("renders the confirmation view with order id, total, status, and items", async () => {
    mockApiGet.mockResolvedValue(mockConfirmationView);

    render(
      <MemoryRouter initialEntries={["/checkout/confirmation/abcdef1234567890abcdef1234567890"]}>
        <Routes>
          <Route path="/checkout/confirmation/:token" element={<CheckoutConfirmation />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("¡Gracias por tu compra!");

    expect(screen.getByText("Número de orden:")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Estado:")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("Producto Confirm")).toBeInTheDocument();
    expect(screen.getByText("× 1")).toBeInTheDocument();
  });

  it("renders not-found UI when the API returns 404 (token not found)", async () => {
    mockApiGet.mockRejectedValue({ status: 404, message: "No encontrada" });

    render(
      <MemoryRouter initialEntries={["/checkout/confirmation/invalid-token"]}>
        <Routes>
          <Route path="/checkout/confirmation/:token" element={<CheckoutConfirmation />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("Página no encontrada");

    expect(screen.getByText("La página que buscas no existe o fue movida.")).toBeInTheDocument();
  });

  it("renders not-found UI for a malformed token (not 32 hex chars)", async () => {
    mockApiGet.mockRejectedValue({ status: 404, message: "No encontrada" });

    render(
      <MemoryRouter initialEntries={["/checkout/confirmation/bad-token"]}>
        <Routes>
          <Route path="/checkout/confirmation/:token" element={<CheckoutConfirmation />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("Página no encontrada");
  });
});

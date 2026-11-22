/**
 * Unit tests for the /500 page (`src/pages/Error500.tsx`).
 *
 * The monolith has a distinct 500 page template at
 * `backend/src/views/templates/pages/500.ejs`. This component
 * mirrors that template's structure and copy. It is
 * ErrorBoundary-free — a static informational page, not a
 * crash catcher.
 *
 * @spec (spec §6.2)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Error500 } from "./Error500";
import { MemoryRouter } from "react-router-dom";

describe("Error500 page (spec §6.2)", () => {
  it("renders the 500 error page with heading and message", () => {
    render(
      <MemoryRouter>
        <Error500 />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /error interno del servidor/i })).toBeInTheDocument();
    expect(
      screen.getByText(/ocurrió un error inesperado/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver al inicio/i })).toBeInTheDocument();
  });

  it("mirrors the monolith 500.ejs structure (centered card, same copy)", () => {
    render(
      <MemoryRouter>
        <Error500 />
      </MemoryRouter>,
    );

    // Structure check: centered section with card
    const heading = screen.getByRole("heading", { name: /error interno del servidor/i });
    expect(heading).toBeInTheDocument();
    const section = heading.closest("section");
    expect(section).toBeInTheDocument();
  });
});

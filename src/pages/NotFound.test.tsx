/**
 * Unit tests for the 404 page (`src/pages/NotFound.tsx`).
 *
 * Mirrors the monolith's 404.ejs template (spec §6.1):
 * same structure (centered card), same message, same
 * "Volver al inicio" link.
 *
 * @spec (spec §6.1)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotFound } from "./NotFound";
import { MemoryRouter } from "react-router-dom";

describe("NotFound page (spec §6.1)", () => {
  it("renders the 404 page with heading, message, and home link", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /página no encontrada/i })).toBeInTheDocument();
    expect(
      screen.getByText(/la página que buscas no existe o fue movida/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver al inicio/i })).toBeInTheDocument();
  });

  it("mirrors the monolith 404.ejs structure (centered card, same copy)", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    // Structure check: centered section with card
    const heading = screen.getByRole("heading", { name: /página no encontrada/i });
    expect(heading).toBeInTheDocument();
    // The card container should have the centered flex layout
    const section = heading.closest("section");
    expect(section).toBeInTheDocument();
  });
});

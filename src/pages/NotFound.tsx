/**
 * 404 catch-all page — mirrors the monolith's 404.ejs template
 * (spec §6.1). Structure, message, and "Volver al inicio" link
 * are faithful to the monolith template.
 *
 * data-* attributes: none specific to this page (uses standard
 * semantic HTML + testids).
 *
 * @spec (spec §6.1)
 */

import { Link } from "react-router-dom";

/**
 * Renders a real 404 page mirroring the monolith's 404.ejs template.
 * @spec (spec §6.1)
 */
export function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center shadow-md md:p-8">
        <h1 className="text-h2 text-ink">Página no encontrada</h1>
        <p className="mt-3 text-muted">
          La página que buscas no existe o fue movida.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

export default NotFound;

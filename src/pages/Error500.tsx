/**
 * /500 page — simple error page mirroring the monolith's 500.ejs template
 * (spec §6.2). The monolith has a distinct 500 page template at
 * `backend/src/views/templates/pages/500.ejs`. This component is
 * ErrorBoundary-free (no try/catch or error boundary logic — it is a
 * static informational page, not a crash catcher).
 *
 * data-* attributes: none specific to this page (uses standard
 * semantic HTML + testids).
 *
 * @spec (spec §6.2)
 */

/**
 * Renders a static 500 error page with the same structure and copy as
 * the monolith's 500.ejs template.
 * @spec (spec §6.2)
 */
export function Error500() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center shadow-md md:p-8">
        <h1 className="text-h2 text-ink">Error interno del servidor</h1>
        <p className="mt-3 text-muted">
          Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.
        </p>
        <a href="/" className="btn-primary mt-6">
          Volver al inicio
        </a>
      </div>
    </section>
  );
}

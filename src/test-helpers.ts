/**
 * Test helpers shared by component tests.
 *
 * `getByAttribute` fills a gap in @testing-library/react: querying by an
 * arbitrary attribute (the parity-relevant `data-*` attributes of spec §5)
 * with optional value matching. Returns the first match or throws, like the
 * built-in queries.
 *
 * @spec (spec §5 — contrato data-*)
 */

// (sin import de testing-library: la consulta corre contra document.body,
// que es donde render() monta por defecto)

/**
 * Returns the first element in the current render whose attribute matches.
 *
 * @param {string} attr - Attribute name (typically a `data-*` attribute).
 * @param {string} [value] - Exact attribute value to match; omit to match presence only.
 * @returns {HTMLElement} The matched element.
 */
export function getByAttribute(attr: string, value?: string): HTMLElement {
  const selector =
    value === undefined ? `[${attr}]` : `[${attr}="${CSS.escape(value)}"]`;
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(
      `getByAttribute: no element found for selector "${selector}"`,
    );
  }
  return el;
}

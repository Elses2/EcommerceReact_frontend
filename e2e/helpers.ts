/**
 * Parity test helpers — shared between React (CSR) and monolith (SSR) targets.
 *
 * Usage:
 *   PARITY_TARGET=react|monolith  (default: react)
 *   PARITY_BASE_URL=http://localhost:5173  (or :18480 for monolith)
 *
 * The helpers abstract the rendering-model difference:
 *   - React: pages hydrate client-side; data-* arrives after async renders.
 *     Use waitForHydration() / waitForSelector() before assertions.
 *   - Monolith: pages are SSR; data-* is in the initial HTML.
 *     Assertions work immediately after goto().
 *
 * All data-* assertions use the SAME selectors and expected values for
 * both targets (spec §5 contract is target-agnostic).
 */

import type { Page, Locator } from '@playwright/test';

// ---------------------------------------------------------------------------
// Target detection
// ---------------------------------------------------------------------------

export const parityTarget = (): 'react' | 'monolith' => {
  const t = (process.env.PARITY_TARGET || 'react').toLowerCase();
  if (t !== 'react' && t !== 'monolith') {
    throw new Error(`Invalid PARITY_TARGET="${t}" — must be react|monolith`);
  }
  return t as 'react' | 'monolith';
};

export const isReact = (): boolean => parityTarget() === 'react';
export const isMonolith = (): boolean => parityTarget() === 'monolith';

// ---------------------------------------------------------------------------
// Rendering-model helpers
// ---------------------------------------------------------------------------

/**
 * For React (CSR) wait until the app has hydrated and the layout root is
 * present. For monolith (SSR) resolve immediately — the data is already
 * in the HTML from the server.
 */
export async function waitForHydration(page: Page): Promise<void> {
  if (isMonolith()) return;
  await page.waitForSelector('[data-logged-in]', { timeout: 10_000 });
}

/**
 * Wait for an element matching `selector` to appear in the DOM.
 * For React this bridges the async render gap; for monolith it resolves
 * instantly if the element is already present.
 */
export async function waitForSelector(
  page: Page,
  selector: string,
  timeout = 8_000,
): Promise<void> {
  await page.locator(selector).first().waitFor({ state: 'attached', timeout });
}

// ---------------------------------------------------------------------------
// Data-* assertion helpers
// ---------------------------------------------------------------------------

/**
 * Assert the visible cart counter (textContent of the first
 * [data-cart-count]) equals expected. This is the observable parity
 * contract for the counter: the monolith's cart.js hydrates the badge
 * TEXT (the attribute keeps its SSR value), while React updates both.
 * @spec (spec §5, §24)
 */
export async function assertCartCountText(
  page: Page,
  expected: number,
): Promise<void> {
  await page.waitForFunction(
    (exp) =>
      document.querySelector('[data-cart-count]')?.textContent?.trim() ===
      String(exp),
    expected,
    { timeout: 10_000 },
  );
}

/**
 * Assert that `selector` (first match) has a `data-*` attribute equal to
 * `expected`. Fails with a descriptive message on mismatch.
 */
export async function assertDataAttr(
  page: Page,
  selector: string,
  attr: string,
  expected: string,
): Promise<void> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'attached' });
  const actual = await el.getAttribute(attr);
  if (actual !== expected) {
    throw new Error(
      `${selector}: ${attr}="${actual}" expected "${expected}"`,
    );
  }
}

/**
 * Assert that `selector` (first match) contains visible text (trimmed).
 */
export async function assertVisibleText(
  page: Page,
  selector: string,
  expectedText: string,
): Promise<void> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'attached' });
  const text = (await el.textContent()) ?? '';
  if (!text.trim().includes(expectedText.trim())) {
    throw new Error(
      `${selector}: text "${text.trim()}" does not include "${expectedText}"`,
    );
  }
}

/**
 * Assert that `selector` is visible (count > 0 and not display:none).
 */
export async function assertVisible(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 8_000 });
}

/**
 * Assert that `selector` is hidden or has zero elements (empty state).
 */
export async function assertHidden(page: Page, selector: string): Promise<void> {
  const count = await page.locator(selector).count();
  if (count > 0) {
    const el = page.locator(selector).first();
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      throw new Error(`${selector} expected hidden but is visible`);
    }
  }
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to a path and wait for the rendering model to settle.
 * - React: waits for hydration + data attributes.
 * - Monolith: just navigates (SSR is immediate).
 */
export async function gotoSettled(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: isReact() ? 'networkidle' : 'load' });
  await waitForHydration(page);
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Register a user via the API (works on both targets — same API shape).
 * Returns the response object.
 */
export async function apiRegister(
  request: any,
  email: string,
  password: string,
  name?: string,
): Promise<any> {
  const response = await request.post('/api/auth/register', {
    data: {
      name: name || 'Parity User',
      lastname: 'Test',
      email,
      password,
    },
  });
  return response;
}

/**
 * Log in via the UI form (works on both targets — same login form shape).
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await gotoSettled(page, '/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for navigation away from login.
  await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10_000 });
}

/**
 * Log out via the UI (click the data-auth-logout button).
 */
export async function logoutViaUI(page: Page): Promise<void> {
  await waitForHydration(page);
  const logoutBtn = page.locator('[data-auth-logout]');
  if ((await logoutBtn.count()) > 0) {
    await logoutBtn.click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 8_000 });
  }
}

/**
 * Log in via the API and inject the auth cookie into the browser context.
 * Works on both targets (same API shape).
 */
export async function apiLogin(
  page: Page,
  request: any,
  email: string,
  password: string,
): Promise<void> {
  const resp = await request.post('/api/auth/login', {
    data: { email, password },
  });
  if (!resp.ok()) {
    const body = await resp.text();
    throw new Error(`API login failed: ${resp.status()} ${body}`);
  }
  const setCookie = resp.headers()['set-cookie'];
  if (setCookie) {
    const cookieParts = setCookie.split(';');
    const [nameValue] = cookieParts;
    const [name, value] = nameValue.split('=');
    await page.context().addCookies([{
      name: name.trim(),
      value: value.trim(),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    }]);
  }
}

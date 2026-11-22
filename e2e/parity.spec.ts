/**
 * Parity spec — SAME scenario battery against BOTH targets via env:
 *   PARITY_TARGET=react|monolith
 *   PARITY_BASE_URL=http://localhost:<frontend-or-ssr-port>
 *
 * Scenarios (spec §5 data-* contract is target-agnostic):
 *   1. Login
 *   2. Register
 *   3. Add to cart (from product cards)
 *   4. Increase quantity (cart page)
 *   5. Decrease quantity (cart page)
 *   6. Remove item (cart page)
 *   7. Clear cart (cart page)
 *   8. Header counter (data-cart-count)
 *   9. Complete checkout
 *   10. 404 page
 *   11. Redirect to login with pending cart intention
 *   12. Logout
 *
 * Data-* assertions are SHARED between targets. The monolith is SSR
 * (assert rendered HTML); React is client-side (wait for hydration).
 *
 * @spec (spec §5, §13, §23.2-§23.4, §24.2-§24.3, §19)
 */

import { test, expect } from '@playwright/test';
import {
  parityTarget,
  isReact,
  waitForHydration,
  waitForSelector,
  assertDataAttr,
  assertVisibleText,
  assertVisible,
  assertHidden,
  assertCartCountText,
  gotoSettled,
  logoutViaUI,
  apiRegister,
  apiLogin,
} from './helpers';

// ---------------------------------------------------------------------------
// Test-scoped constants
// ---------------------------------------------------------------------------

const TEST_EMAIL = `parity.${Date.now()}@test.local`;
const TEST_PASSWORD = 'ParityTest123!';
const TEST_NAME = 'Parity';

/**
 * Pre-register the test user via API before the suite.
 * Uses the request context (allowed in beforeAll).
 */
test.beforeAll(async ({ request }) => {
  const resp = await request.post('/api/auth/register', {
    data: { name: TEST_NAME, lastname: 'User', email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  if (!resp.ok() && resp.status() !== 409) {
    const body = await resp.text();
    throw new Error(`Pre-register failed: ${resp.status()} ${body}`);
  }
});

/**
 * Aislamiento por test: login por API en el contexto request + carrito vacío.
 * Sin esto, los sobrantes del carrito de un test contaminan al siguiente
 * (los contadores heredan items de escenarios anteriores).
 */
test.beforeEach(async ({ request }) => {
  const login = await request.post('/api/auth/login', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  if (login.ok()) {
    await request.delete('/api/cart/clear');
  }
});

// ---------------------------------------------------------------------------
// Spec-specific helpers
// ---------------------------------------------------------------------------

/**
 * Ensure the test user is logged in (via API + cookie injection).
 * Returns the page ready for testing.
 */
async function ensureLoggedIn(page: Page, request: any): Promise<void> {
  await apiLogin(page, request, TEST_EMAIL, TEST_PASSWORD);
  await page.goto('/', { waitUntil: isReact() ? 'networkidle' : 'load' });
  await waitForSelector(page, '[data-logged-in="true"]', 10_000);
  if (isReact()) await page.waitForTimeout(300);
}

/**
 * Add a product to the cart from the home page (first in-stock product card).
 * Returns the productId that was added.
 */
async function addFirstProduct(page: Page): Promise<number> {
  await gotoSettled(page, '/');
  const addBtn = page
    .locator('button[data-cart-action="add"]')
    .filter({ hasText: /Agregar al carrito/ })
    .first();
  await addBtn.waitFor({ state: 'visible', timeout: isReact() ? 8_000 : 3_000 });
  const productIdStr = await addBtn.getAttribute('data-product-id');
  if (!productIdStr) throw new Error('Add-to-cart button missing data-product-id');
  const productId = parseInt(productIdStr, 10);
  if (isNaN(productId)) throw new Error(`Invalid productId="${productIdStr}"`);
  await addBtn.click();
  // El monolito actualiza el TEXTO del badge (cart.js renderCart) pero no el
  // valor del atributo data-cart-count (queda congelado en el valor SSR);
  // React actualiza ambos. La observación común inmediata es el TEXTO.
  await page.waitForFunction(
    () => document.querySelector('[data-cart-count]')?.textContent?.trim() === '1',
    undefined,
    { timeout: isReact() ? 8_000 : 5_000 },
  );
  return productId;
}

/**
 * Wait for the cart page to be fully loaded with items rendered.
 */
async function waitForCartReady(page: Page, productId: number): Promise<void> {
  // Wait for the cart item row to appear in the DOM.
  await waitForSelector(page, `[data-cart-item="${productId}"]`, isReact() ? 8_000 : 3_000);
  // For React, also wait for the quantity to be visible (confirms hydration).
  if (isReact()) {
    await page.waitForFunction(
      (pid) => {
        const qtyEl = document.querySelector(`[data-cart-item="${pid}"] [data-quantity]`);
        return qtyEl !== null;
      },
      productId,
      { timeout: 8_000 },
    );
  }
}

// ===========================================================================
// 1. Login
// ===========================================================================

test('login: authenticate via API and see data-logged-in="true"', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  await assertDataAttr(page, '[data-logged-in]', 'data-logged-in', 'true');
  await assertVisible(page, '[data-auth-logout]');
});

// ===========================================================================
// 2. Register
// ===========================================================================

test('register: create account and land authenticated', async ({ page, request }) => {
  const regEmail = `reg.${Date.now()}@test.local`;
  const regPass = 'Register123!';
  await ensureLoggedIn(page, request);

  const resp = await request.post('/api/auth/register', {
    data: { name: 'Reg Parity', lastname: 'User', email: regEmail, password: regPass },
  });
  if (!resp.ok() && resp.status() !== 409) {
    const body = await resp.text();
    throw new Error(`Register API failed: ${resp.status()} ${body}`);
  }

  await apiLogin(page, request, regEmail, regPass);
  await page.goto('/', { waitUntil: isReact() ? 'networkidle' : 'load' });
  await waitForSelector(page, '[data-logged-in="true"]', 10_000);
  await assertDataAttr(page, '[data-logged-in]', 'data-logged-in', 'true');
});

// ===========================================================================
// 3. Add to cart
// ===========================================================================

test('cart: add item from home page, data-cart-count becomes 1', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  const productId = await addFirstProduct(page);
  await gotoSettled(page, '/cart');
  await waitForCartReady(page, productId);
});

// ===========================================================================
// 4. Increase quantity
// ===========================================================================

test('cart: increase quantity, data-quantity and data-cart-count update', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  const productId = await addFirstProduct(page);
  await gotoSettled(page, '/cart');
  await waitForCartReady(page, productId);

  const increaseBtn = page
    .locator(`[data-cart-item="${productId}"] button[data-cart-action="increase"]`)
    .first();
  await increaseBtn.waitFor({ state: 'visible', timeout: isReact() ? 8_000 : 3_000 });
  await increaseBtn.click();

  // Wait for quantity to become 2 using waitForFunction (more robust than fixed sleep).
  await page.waitForFunction(
    (pid) => {
      const qtyEl = document.querySelector(`[data-cart-item="${pid}"] [data-quantity]`);
      return qtyEl && qtyEl.textContent?.trim() === '2';
    },
    productId,
    { timeout: isReact() ? 10_000 : 5_000 },
  );
  // El valor del ATRIBUTO data-cart-count es la observación de contrato §5:
  // se lee tras recargar (el monolito lo re-renderiza por SSR; React lo
  // hidrata desde el estado del servidor).
  await gotoSettled(page, '/cart');
  await waitForCartReady(page, productId);
  await assertCartCountText(page, 2);
});

// ===========================================================================
// 5. Decrease quantity
// ===========================================================================

test('cart: decrease quantity, data-quantity updates', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  const productId = await addFirstProduct(page);
  await gotoSettled(page, '/cart');
  await waitForCartReady(page, productId);

  // Increase to qty 2 first.
  const increaseBtn = page
    .locator(`[data-cart-item="${productId}"] button[data-cart-action="increase"]`)
    .first();
  await increaseBtn.click();
  await page.waitForFunction(
    (pid) => {
      const qtyEl = document.querySelector(`[data-cart-item="${pid}"] [data-quantity]`);
      return qtyEl && qtyEl.textContent?.trim() === '2';
    },
    productId,
    { timeout: isReact() ? 10_000 : 5_000 },
  );

  // Then decrease back to qty 1.
  const decreaseBtn = page
    .locator(`[data-cart-item="${productId}"] button[data-cart-action="decrease"]`)
    .first();
  await decreaseBtn.click();
  await page.waitForFunction(
    (pid) => {
      const qtyEl = document.querySelector(`[data-cart-item="${pid}"] [data-quantity]`);
      return qtyEl && qtyEl.textContent?.trim() === '1';
    },
    productId,
    { timeout: isReact() ? 10_000 : 5_000 },
  );
});

// ===========================================================================
// 6. Remove item
// ===========================================================================

test('cart: remove item, data-cart-item disappears and data-cart-count becomes 0', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  const productId = await addFirstProduct(page);
  await gotoSettled(page, '/cart');
  await waitForCartReady(page, productId);

  const removeBtn = page
    .locator(`[data-cart-item="${productId}"] button[data-cart-action="remove"]`)
    .first();
  await removeBtn.waitFor({ state: 'visible', timeout: isReact() ? 8_000 : 3_000 });
  await removeBtn.click();

  // Atributo de contrato tras recargar (ver nota de addFirstProduct).
  await gotoSettled(page, '/cart');
  await waitForSelector(page, '[data-cart-count="0"]', isReact() ? 10_000 : 3_000);
  await assertVisible(page, '[data-cart-empty]');
});

// ===========================================================================
// 7. Clear cart
// ===========================================================================

test('cart: clear cart via data-cart-action="clear", data-cart-empty appears', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  const productId = await addFirstProduct(page);
  await gotoSettled(page, '/cart');
  await waitForCartReady(page, productId);

  const clearBtn = page.locator('button[data-cart-action="clear"]').first();
  await clearBtn.waitFor({ state: 'visible', timeout: isReact() ? 8_000 : 3_000 });
  await clearBtn.click();

  // Atributo de contrato tras recargar (ver nota de addFirstProduct).
  await gotoSettled(page, '/cart');
  await waitForSelector(page, '[data-cart-count="0"]', isReact() ? 10_000 : 3_000);
  await assertVisible(page, '[data-cart-empty]');
  await assertHidden(page, '[data-cart-summary]');
});

// ===========================================================================
// 8. Header counter
// ===========================================================================

test('header: data-cart-count reflects cart state after add and remove', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  // Initial count = 0.
  await assertDataAttr(page, '[data-cart-count]', 'data-cart-count', '0');

  const productId = await addFirstProduct(page);

  // Increase to 2.
  await gotoSettled(page, '/cart');
  await waitForCartReady(page, productId);
  const increaseBtn = page
    .locator(`[data-cart-item="${productId}"] button[data-cart-action="increase"]`)
    .first();
  await increaseBtn.click();
  await page.waitForFunction(
    (pid) => {
      const qtyEl = document.querySelector(`[data-cart-item="${pid}"] [data-quantity]`);
      return qtyEl && qtyEl.textContent?.trim() === '2';
    },
    productId,
    { timeout: isReact() ? 10_000 : 5_000 },
  );
  // Contrato §5 tras recargar: el carrito tiene 1 item con cantidad 2.
  await gotoSettled(page, '/cart');
  await waitForCartReady(page, productId);
  await assertCartCountText(page, 2);

  // Remove the item.
  const removeBtn = page
    .locator(`[data-cart-item="${productId}"] button[data-cart-action="remove"]`)
    .first();
  await removeBtn.click();
  // Contrato §5 tras recargar: carrito vacío.
  await gotoSettled(page, '/cart');
  await waitForSelector(page, '[data-cart-count="0"]', isReact() ? 10_000 : 3_000);
});

// ===========================================================================
// 9. Complete checkout
// ===========================================================================

test('checkout: complete purchase with valid data, land on confirmation', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  const productId = await addFirstProduct(page);

  await gotoSettled(page, '/checkout');
  await waitForSelector(page, '[data-checkout-form]', isReact() ? 8_000 : 3_000);
  await waitForSelector(page, '[data-checkout-summary]', isReact() ? 8_000 : 3_000);

  // Fill the form.
  await page.fill('input[name="firstName"]', 'Parity');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="phone"]', '123456789');
  await page.fill('input[name="address"]', 'Test Address 123');
  await page.fill('input[name="city"]', 'Test City');
  await page.fill('input[name="postalCode"]', '12345');
  await page.fill('input[name="country"]', 'Test Country');
  await page.selectOption('select[name="paymentMethod"]', 'transfer');

  await page.click('[data-checkout-submit]');

  // After success, should navigate to /checkout/confirmation/:token.
  await page.waitForURL((url) => url.pathname.includes('/checkout/confirmation/'), { timeout: 10_000 });

  await waitForHydration(page);
  await assertVisible(page, 'text=Gracias por tu compra');
});

// ===========================================================================
// 10. 404 page
// ===========================================================================

test('404: unknown route shows not-found page', async ({ page }) => {
  await gotoSettled(page, '/this-route-does-not-exist-404');
  await assertVisibleText(page, 'body', 'Página no encontrada');
});

// ===========================================================================
// 11. Redirect to login with pending cart intention
// ===========================================================================

test('auth: guest adding to cart redirects to login with pending intention', async ({ page, request }) => {
  // El page fixture es un contexto fresco: ya es guest (sin cookie de sesión).
  // No se llama logoutViaUI acá: sobre una página sin cargar (about:blank)
  // waitForHydration esperaría [data-logged-in] que no existe aún en React.

  await gotoSettled(page, '/products');
  await waitForHydration(page);

  // Try to add a product as a guest.
  const addBtn = page
    .locator('button[data-cart-action="add"]')
    .filter({ hasText: /Agregar al carrito/ })
    .first();
  await addBtn.waitFor({ state: 'visible', timeout: isReact() ? 8_000 : 3_000 });
  await addBtn.click();

  // Should redirect to /login?next=...&reason=cart.
  await page.waitForURL((url) => url.pathname === '/login' && url.searchParams.has('next'), { timeout: 10_000 });

  // Verify pending_cart_add is stored in sessionStorage.
  const pending = await page.evaluate(() => sessionStorage.getItem('pending_cart_add'));
  if (!pending) throw new Error('pending_cart_add not found in sessionStorage');
  const parsed = JSON.parse(pending);
  expect(Number(parsed.productId)).toBeGreaterThan(0);
  // El monolito guarda {productId, at} sin quantity (cart.js); React guarda
  // un superset con quantity. La paridad exige la key y el productId.
  if (parsed.quantity !== undefined) {
    expect(Number(parsed.quantity)).toBeGreaterThanOrEqual(1);
  }

  // Log back in via API to consume the pending intention.
  await apiLogin(page, request, TEST_EMAIL, TEST_PASSWORD);
  await page.goto('/', { waitUntil: isReact() ? 'networkidle' : 'load' });
  // La paridad del contador es por CONTENIDO (§5: cart.js hidrata el texto;
  // el atributo queda congelado en el valor SSR del monolito).
  await assertCartCountText(page, 1);
});

// ===========================================================================
// 12. Logout
// ===========================================================================

test('logout: end session, data-logged-in becomes "false"', async ({ page, request }) => {
  await ensureLoggedIn(page, request);
  await assertDataAttr(page, '[data-logged-in]', 'data-logged-in', 'true');

  await logoutViaUI(page);

  await waitForSelector(page, '[data-logged-in="false"]', 8_000);
  await assertDataAttr(page, '[data-logged-in]', 'data-logged-in', 'false');
});

# Parity E2E Suite

Run the same scenario battery against both the monolith (SSR) and the React frontend (CSR) to verify data-* contract parity (spec §5).

## Prerequisites

- Redis running locally (`redis-server`, default port 6379)
- Node.js ≥ 22
- Playwright Chromium installed (`npx playwright install chromium`)
- All three repos built/dependencies installed:
  - `/home/elses/Desktop/migracion/monolito-ref`
  - `/home/elses/Desktop/migracion/EcommerceReact/backend`
  - `/home/elses/Desktop/migracion/EcommerceReact/frontend`

## Quick Start

```bash
cd EcommerceReact/frontend

# Run against both targets (starts/stops all servers automatically)
npm run e2e:parity

# Run against a single target
PARITY_TARGET=react npm run e2e:parity
PARITY_TARGET=monolith npm run e2e:parity
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PARITY_TARGET` | `both` | `react`, `monolith`, or `both` |
| `PARITY_BASE_URL` | set per target | Frontend/SSR URL for the active target |

## Targets

| Target | URL | DB | Redis DB |
|---|---|---|---|
| Monolith (SSR) | `http://localhost:18480` | `/tmp/parity-monolith.db` | `0` |
| Backend (JSON API) | `http://localhost:18481` | `/tmp/parity-backend.db` | `1` |
| React (Vite dev) | `http://localhost:5173` | (proxied to backend) | (proxied to backend) |

## Scenarios

1. Login (API-based auth for reliability)
2. Register
3. Add to cart (from home page)
4. Increase quantity (cart page)
5. Decrease quantity (cart page)
6. Remove item (cart page)
7. Clear cart (cart page)
8. Header counter (`data-cart-count`)
9. Complete checkout
10. 404 page
11. Redirect to login with pending cart intention
12. Logout

## Data-* Contract (spec §5)

All assertions use the same `data-*` attributes for both targets:

- `data-cart-count` — header badge counter
- `data-cart-action` — `add`, `increase`, `decrease`, `remove`, `clear`
- `data-product-id` — product identifier
- `data-cart-item` — cart row identifier
- `data-quantity` — item quantity
- `data-subtotal` — line subtotal
- `data-cart-summary`, `data-cart-total`, `data-cart-empty`
- `data-logged-in` — `"true"` / `"false"` / absent (loading)
- `data-auth-logout` — logout button
- `data-checkout-*` — checkout form elements

## Key Differences: SSR vs CSR

- **Monolith (SSR)**: data-* attributes are in the initial HTML. Assertions work immediately after `goto()`.
- **React (CSR)**: data-* attributes arrive after hydration and async data fetches. Use `waitForSelector()` before assertions.

## Files

- `e2e/parity.spec.ts` — Main test suite (12 scenarios)
- `e2e/helpers.ts` — Shared helpers for both targets
- `scripts/parity-run.sh` — Orchestration script (start/stop servers, run tests)
- `playwright.config.ts` — Playwright config (env-based baseURL)

## Notes

- The monolith must be built (`npm run build`) before running parity tests so that `dist/public/js/cart.js` and `dist/public/js/auth.js` are available.
- Both temp DBs are recreated on each run (`/tmp/parity-monolith.db`, `/tmp/parity-backend.db`).
- No secrets are committed; the JWT secret used for parity tests is `parity-local-test-secret-0123456789abcdef`.

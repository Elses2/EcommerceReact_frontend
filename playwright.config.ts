import { defineConfig } from '@playwright/test';

/**
 * Playwright parity config — runs the SAME scenario battery against BOTH
 * targets via env vars:
 *   PARITY_TARGET=react|monolith   (default: react)
 *   PARITY_BASE_URL=http://localhost:5173  (frontend or SSR home)
 *
 * - React target: client-side SPA on :5173 with Vite proxy → backend :18481.
 *   Must wait for hydration + async data before asserting data-*.
 * - Monolith target: server-rendered pages on :18480; data-* is in the
 *   initial HTML. Assert immediately after goto (no hydration wait).
 */
export default defineConfig({
  testDir: './e2e',
  // La suite de paridad muta estado compartido (mismo usuario y Redis) entre
  // escenarios: corren secuenciales con 1 worker. fullyParallel en paralelo
  // entrelaza acciones de carrito y las hace fallar de forma no determinista.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.PARITY_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  // No webServer here — the orchestration script starts/stops all servers.
  // Browsers are not downloaded in CI; install locally with `npx playwright install chromium`.
});

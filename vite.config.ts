import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const apiProxyUrl = process.env.VITE_API_PROXY_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    // Mantener los excludes por defecto (node_modules, dist, …) y sumar e2e.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyUrl,
        changeOrigin: true,
        headers: {
          'X-Forwarded-Host': 'localhost:5173',
          'X-Forwarded-Proto': 'http',
        },
      },
    },
  },
});

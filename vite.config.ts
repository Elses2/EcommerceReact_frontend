import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const apiProxyUrl = process.env.VITE_API_PROXY_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyUrl,
        changeOrigin: true,
      },
    },
  },
});

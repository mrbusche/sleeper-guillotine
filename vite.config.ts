import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        biweekly: resolve(import.meta.dirname, 'biweekly.html'),
      },
    },
  },
});

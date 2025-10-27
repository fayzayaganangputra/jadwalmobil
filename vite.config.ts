import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚙️ Ini penting untuk GitHub Pages
  base: '/jadwalmobil/',

  // Opsional, tapi tetap kamu punya ini untuk optimisasi
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/medison_blind_test/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 6006,
  },
});


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Ensure process.env is polyfilled for any legacy libraries if needed
    'process.env': {}
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // importante
    port: 5173, 
    open: true,
    proxy: {
      '/api': {
        target: 'http://10.0.0.46:5000/', // backend Node
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});

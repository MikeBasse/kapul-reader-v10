import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf-vendor': ['pdfjs-dist'],
          'epub-vendor': ['epubjs']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'epubjs']
  },
  server: {
    port: 3000,
    open: true,
    // Proxy API requests to the backend server during development
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173
  }
})

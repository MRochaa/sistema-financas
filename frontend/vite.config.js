import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração do Vite para build de produção
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    // Gera arquivos otimizados para produção
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          utils: ['axios', 'lucide-react']
        }
      }
    }
  },
  define: {
    // Define a URL da API baseada em variável de ambiente
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api')
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/mobiliteit': {
        target: 'https://cdt.mobiliteit.lu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mobiliteit/, '')
      }
    }
  }
})
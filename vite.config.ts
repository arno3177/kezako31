import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/proxy-franceinfo': {
        target: 'https://www.francetvinfo.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-franceinfo/, '')
      },
      '/proxy-france24': {
        target: 'https://www.france24.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-france24/, '')
      },
      '/proxy-lemonde': {
        target: 'https://www.lemonde.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-lemonde/, '')
      },
      '/proxy-lessentiel': {
        target: 'https://partner-feeds.lessentiel.lu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-lessentiel/, '')
      }
    }
  }
})
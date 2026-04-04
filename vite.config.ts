import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/shopee-proxy': {
        target: 'https://s.shopee.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/shopee-proxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Emula um navegador real para não ser bloqueado pela Shopee (Cloudflare)
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
            proxyReq.setHeader('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
          });
          proxy.on('proxyRes', () => {
            // Shopee uses 301/302 redirects. If it redirects to shopee.com.br, we need to handle it in frontend or let it pass
            // But since CORS is the issue, Vite proxy will automatically stream the response back.
          });
        }
      }
    }
  }
})

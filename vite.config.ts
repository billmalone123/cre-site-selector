import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/cre-site-selector/',
  plugins: [react()],
  server: {
    proxy: {
      // Yelp blocks browser CORS — proxy through Vite dev server
      '/yelp-api': {
        target: 'https://api.yelp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yelp-api/, ''),
        headers: {
          Origin: 'https://api.yelp.com',
        },
      },
      // Eventbrite proxy
      '/eventbrite-api': {
        target: 'https://www.eventbriteapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/eventbrite-api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const auth = req.headers['authorization']
            if (auth) proxyReq.setHeader('Authorization', auth)
          })
        },
      },
    },
  },
})

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/readili-web/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.ttf', 'icons/*.png'],
      manifest: {
        name: 'readiLi',
        short_name: 'readiLi',
        description: 'Smart packing list generator for trips',
        theme_color: '#7A9BB5',
        background_color: '#FAFAFA',
        display: 'standalone',
        start_url: '/readili-web/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 21600 },
            },
          },
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geocoding-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 604800 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/pexels-api': {
        target: 'https://api.pexels.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pexels-api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});

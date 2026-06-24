import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/dahihandi/', // 👈 १. सर्वात महत्त्वाचं: हा बेस पाथ इथे हवाच!
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline', // 👈 PWA ला योग्य पाथवर रजिस्टर करण्यासाठी
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'DahiHandi Management Platform',
        short_name: 'DahiHandi APP',
        description: 'Manage teams, t-shirt reports, and insurance details easily.',
        theme_color: '#ff6600', // आपला ऑरेंज ब्रँड कलर
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/dahihandi/',      // 👈 २. PWA चा एरिया ठरवण्यासाठी
        start_url: '/dahihandi/',  // 👈 ३. ॲप ओपन झाल्यावर कोणत्या पाथने सुरू व्हावे यासाठी
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
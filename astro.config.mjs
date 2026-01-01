// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Detect if we're running in development mode
const isDev = process.argv.includes('dev') || process.env.npm_lifecycle_event === 'dev';

// https://astro.build/config
export default defineConfig({
  // Configure for custom domain deployment
  site: 'https://lulunajoyas.com',
  base: '/',
  
  integrations: [
    react(), 
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Custom entries for specific pages
      customPages: [
        'https://lulunajoyas.com/',
        'https://lulunajoyas.com/catalog',
        'https://lulunajoyas.com/admin'
      ],
      // Filter out admin pages from public sitemap
      filter: (page) => !page.includes('/admin'),
      // Add alternate language links if needed
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es',
          en: 'en'
        }
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // Exclude Firebase from SSR to avoid server-side errors
      noExternal: ['firebase'],
    },
  },

  // Output as static site for GitHub Pages
  output: 'static',
});
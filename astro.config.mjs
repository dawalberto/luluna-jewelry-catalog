// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Detect if we're running in development mode
const isDev = process.argv.includes('dev') || process.env.npm_lifecycle_event === 'dev';

// https://astro.build/config
export default defineConfig({
  // Configure for GitHub Pages deployment
  site: 'https://dawalberto.github.io',
  // Only use base path in production (for GitHub Pages)
  // In development, access the site at http://localhost:4321/
  base: isDev ? '/' : '/luluna-jewelry-catalog',
  
  integrations: [react(), sitemap()],

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
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
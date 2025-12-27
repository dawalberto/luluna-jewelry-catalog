// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Configure for GitHub Pages deployment
  site: 'https://dawalberto.github.io',
  // Only use base path in production (for GitHub Pages)
  // In development, access the site at http://localhost:4321/
  base: process.env.NODE_ENV === 'production' ? '/luluna-jewelry-catalog' : '/',
  
  integrations: [react()],

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
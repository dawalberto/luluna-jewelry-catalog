// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Configure for GitHub Pages deployment
  // Uncomment and update 'site' and 'base' when deploying to GitHub Pages:
  // site: 'https://your-username.github.io',
  // base: '/luluna-jewelry-catalog',
  
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
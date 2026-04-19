import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import keystatic from '@keystatic/astro';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://idkstorytellingbutihavestoriestotell.netlify.app',
  // Match Netlify's pretty-URL behavior so internal links skip the 301 hop.
  trailingSlash: 'always',
  integrations: [react(), mdx(), keystatic()],
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: false,
  },
});

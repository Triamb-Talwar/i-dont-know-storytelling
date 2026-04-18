import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import keystatic from '@keystatic/astro';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://i-dont-know-storytelling.local',
  integrations: [react(), mdx(), keystatic()],
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: false,
  },
});

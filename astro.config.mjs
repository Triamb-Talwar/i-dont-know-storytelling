import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import keystatic from '@keystatic/astro';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://idkstorytellingbutihavestoriestotell.netlify.app',
  // 'ignore' accepts both /x and /x/ without a redirect, which is what
  // Keystatic's API client expects — 'always' caused its JSON fetches to
  // bounce through a redirect and receive HTML back. Internal links still
  // use /posts/<slug>/ and Netlify's pretty-URL behavior keeps them clean.
  trailingSlash: 'ignore',
  integrations: [react(), mdx(), keystatic()],
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: false,
  },
});

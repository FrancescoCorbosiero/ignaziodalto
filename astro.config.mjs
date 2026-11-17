// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import preact from '@astrojs/preact';

// Every page is rendered on request: the catalog lives in the server's
// memory and refreshes itself from scs-b2b (src/server/catalog.ts).
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [preact()],
  server: { host: true },
  // The site is noindex: no sitemap, no canonical domain needed at build.
  security: { checkOrigin: true },
  devToolbar: { enabled: false },
});

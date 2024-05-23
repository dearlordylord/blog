import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from '@astrojs/sitemap';
import wasm from "vite-plugin-wasm";
import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel/static";

const contentSecurityPolicy = [
  // `default-src 'self'`,
  // `img-src *`,
  // `script-src 'self' 'unsafe-eval' 'unsafe-inline'`,
  // `style-src 'self' 'unsafe-inline'`,
  `connect-src 'self' api.umami.is cloud.umami.is`,
  // `frame-ancestors 'self' ${frameAncestors}`,
];

// https://astro.build/config
export default defineConfig({
  site: 'https://www.loskutoff.com',
  integrations: [react(), tailwind(), sitemap(), mdx()],
  vite: {
    plugins: [wasm() //, topLevelAwait()
    ]
  },
  output: "static",
  adapter: vercel(),
  server: {
    headers: {
      'Content-Security-Policy': contentSecurityPolicy
        .join(';')
        .replace(/\s{2,}/g, ' ')
        .trim()
    }
  }
});
import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from '@astrojs/sitemap';
import wasm from "vite-plugin-wasm";
import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  site: 'https://www.loskutoff.com',
  integrations: [react(), tailwind(), sitemap(), mdx()],
  vite: {
    plugins: [wasm() //, topLevelAwait()
    ]
  },
  experimental: {
    // hacky hacks https://github.com/phosphor-icons/react/issues/45#issuecomment-1760724607
    optimizePackageImports: ['@phosphor-icons/react']
  },
  output: "server",
  adapter: vercel()
});
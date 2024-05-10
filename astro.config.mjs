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
  output: "server",
  adapter: vercel()
});
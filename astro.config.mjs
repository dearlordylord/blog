import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from '@astrojs/sitemap';
import wasm from "vite-plugin-wasm";
import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel/static";
import remarkMermaid from 'astro-diagram/remark-mermaid';


// https://astro.build/config
export default defineConfig({
  site: 'https://www.loskutoff.com',
  integrations: [react(), tailwind(), sitemap(), mdx()],
  vite: {
    plugins: [wasm() //, topLevelAwait()
    ]
  },
  output: "static",
  adapter: vercel({
    webAnalytics: {
      enabled: true
    }
  }),
  markdown: {
    remarkPlugins: [remarkMermaid],
  }
});
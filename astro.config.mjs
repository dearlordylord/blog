import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import wasm from "vite-plugin-wasm";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://www.dearlordylord.com",
  integrations: [react(), sitemap(), mdx()],
  vite: {
    plugins: [
      tailwindcss(),
      wasm(), //, topLevelAwait()
    ],
  },
  output: "static",
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});

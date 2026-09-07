import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    // no published is draft
    published: z.date().optional(),
    opengraphImage: z.string().optional(),
    opengraphImageAlt: z.string().optional(),
  }),
});

export const collections = { blog };

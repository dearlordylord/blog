import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    // no published is draft
    published: z.date().optional(),
    opengraphImage: z.string().optional(),
    opengraphImageAlt: z.string().optional(),
  }),
});

export const collections = { blog };

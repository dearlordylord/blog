import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    // no published is draft
    published: z.date().optional(),
  }),
});

export const collections = { blog };
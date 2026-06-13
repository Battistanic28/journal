import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const ramblings = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/ramblings" }),
  schema: z.object({
    title: z.string(),
    published: z.string(), // TODO: use date type - rename to pubDate
    slug: z.string()
  }),
});

export const collections = { ramblings };

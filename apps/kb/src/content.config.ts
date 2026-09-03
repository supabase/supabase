import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// Every entry here is rendered through GuideLayout by
// src/pages/guides/[...slug].astro — dropping a new file in
// src/content/guides doesn't need any per-file layout wiring.
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    topics: z.array(z.string()).optional(),
    github_url: z.string().optional(),
  }),
})

export const collections = { guides }

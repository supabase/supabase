import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

import { TOPIC_NAMES } from './lib/topics'

// Every entry here is rendered through GuideLayout by
// src/pages/guides/[...slug].astro — dropping a new file in
// src/content/guides doesn't need any per-file layout wiring.
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // z.enum (not z.string) so a guide referencing a topic outside TOPICS
    // fails content validation instead of silently rendering an orphaned tag.
    topics: z.array(z.enum(TOPIC_NAMES)),
    github_url: z.string().optional(),
  }),
})

export const collections = { guides }

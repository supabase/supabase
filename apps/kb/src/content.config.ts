import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

import { TOPIC_NAMES } from './lib/topics'

// Format date as "26 SEPTEMBER 2026"
const formatDate = (date: Date): string => {
  // Adjust for timezone offset to preserve the intended date
  const adjusted = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
    .format(adjusted)
    .toUpperCase()
}

// Every entry here is rendered through GuideLayout by
// src/pages/guides/[...slug].astro — dropping a new file in
// src/content/guides doesn't need any per-file layout wiring.
const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // z.enum (not z.string) so a guide referencing a topic outside TOPICS
    // fails content validation instead of silently rendering an orphaned tag.
    topics: z.array(z.enum(TOPIC_NAMES)),
    // Surfaces the guide in the homepage's "Featured Guides" section.
    pinned: z.boolean().default(false),
    github_url: z.string().optional(),
  }),
})

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      date: z.date(),
    })
    .transform((data) => ({
      ...data,
      formattedDate: formatDate(data.date),
    })),
})

export const collections = { guides, articles }

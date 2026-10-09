import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

import { TOPIC_NAMES } from './lib/topics'

// Shared by every article-like collection (guides, troubleshooting) so their
// schemas can't drift on these fields — both render through ArticleLayout via
// a matching catch-all page and need the same base fields. `description` and
// `topics` are NOT shared: each collection validates those differently below.
const articleFields = {
  title: z.string(),
  // Surfaces the guide in the homepage's "Featured Guides" section.
  pinned: z.boolean().default(false),
  github_url: z.string().optional(),
}

// Every entry here is rendered through ArticleLayout by
// src/pages/guides/[...slug].astro — dropping a new file in
// src/content/guides doesn't need any per-file layout wiring.
const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    ...articleFields,
    description: z.string(),
    // z.enum (not z.string) so a guide referencing a topic outside TOPICS
    // fails content validation instead of silently rendering an orphaned tag.
    topics: z.array(z.enum(TOPIC_NAMES)),
  }),
})

// Fetched from the private supabase/troubleshooting repo by
// scripts/federated-content/fetch-federated-content.ts (a prebuild step) —
// entirely generated, never hand-authored, see .gitignore. Rendered through
// ArticleLayout by src/pages/troubleshooting/[...slug].astro.
const troubleshooting = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/troubleshooting' }),
  schema: z.object({
    ...articleFields,
    // The source has no description field, and ArticleLayout already
    // renders this conditionally — optional rather than synthesized.
    description: z.string().optional(),
    // Passed through verbatim from the source repo's own frontmatter, not
    // validated against TOPIC_NAMES — this collection's topic vocabulary is
    // the source repo's, not kb's, so entries won't all match a kb Topic
    // (ArticleLayout and the topic pages degrade gracefully for those).
    topics: z.array(z.string()).default([]),
  }),
})

export const collections = { guides, troubleshooting }

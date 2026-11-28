export const SUPABASE_FEATURES = {
  database: { label: 'Database', description: 'Postgres tables, queries and migrations' },
  auth: { label: 'Auth', description: 'Sign-in, sessions and user management' },
  storage: { label: 'Storage', description: 'File uploads and CDN delivery' },
  realtime: { label: 'Realtime', description: 'Live updates, broadcast and presence' },
  'edge-functions': { label: 'Edge Functions', description: 'Server-side TypeScript at the edge' },
  vectors: { label: 'Vectors', description: 'Embeddings and semantic search with pgvector' },
  cron: { label: 'Cron', description: 'Scheduled jobs inside Postgres' },
  queues: { label: 'Queues', description: 'Durable background job queues' },
} as const

export type SupabaseFeature = keyof typeof SUPABASE_FEATURES

export const EXAMPLE_CATEGORIES = {
  ai: 'AI',
  saas: 'SaaS',
  social: 'Social',
  productivity: 'Productivity',
  commerce: 'Commerce',
  'developer-tools': 'Developer tools',
} as const

export type ExampleCategory = keyof typeof EXAMPLE_CATEGORIES

export interface ExampleAuthor {
  name: string
  url: string
}

export interface ExampleEnvVar {
  name: string
  description: string
}

export interface ExampleDeploy {
  /** One-click deploy link, e.g. a Vercel clone URL. */
  deployUrl?: string
  /** Human-readable steps to run the example against your own project. */
  steps: string[]
  env: ExampleEnvVar[]
}

export interface Example {
  /** URL-safe unique id, used for `/<slug>`. */
  slug: string
  title: string
  /** One sentence shown on the card. */
  tagline: string
  /** Paragraphs shown on the detail page. */
  description: string[]
  category: ExampleCategory
  features: SupabaseFeature[]
  /** Other technologies used, e.g. "Next.js". */
  stack: string[]
  author: ExampleAuthor
  /** ISO date (YYYY-MM-DD). */
  updatedAt: string
  repoUrl: string
  /** Hosted app, e.g. a Vercel deployment. Embedded on the detail page and linked as the live demo. */
  demoUrl: string
  /** Set when the iframe should load a different URL than the "Live demo" link. */
  embedUrl?: string
  deploy: ExampleDeploy
  featured?: boolean
}

/** Identity helper that type-checks an example definition. */
export function defineExample(example: Example): Example {
  return example
}

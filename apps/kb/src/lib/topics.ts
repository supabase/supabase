// Canonical list of guide topics. Single source of truth for the `topics`
// field in src/content.config.ts (so a guide with an unsupported topic fails
// content validation), the "Topics" nav menu, and the /topics/[topic] pages.
//
// `pinned` topics surface as cards on the homepage (see src/pages/index.astro)
// — keep this to a handful so that section stays a highlights row, not a
// second copy of the full topic list.
export const TOPICS = [
  {
    name: 'Migration',
    description: 'Moving data, schemas, or projects onto Supabase',
    pinned: false,
  },
  {
    name: 'Comparison',
    description: 'How Supabase compares to other databases and platforms',
    pinned: false,
  },
  { name: 'Troubleshooting', description: 'Common errors and how to resolve them', pinned: false },
  {
    name: 'Tutorial',
    description: 'Step-by-step walkthroughs for building with Supabase',
    pinned: true,
  },
  { name: 'Storage', description: 'Uploading, managing, and serving files', pinned: false },
  { name: 'Auth', description: 'Authentication, authorization, and user management', pinned: true },
  { name: 'Database', description: 'Postgres schemas, queries, and performance', pinned: true },
  {
    name: 'Edge Functions',
    description: 'Deploying and running serverless functions',
    pinned: false,
  },
  { name: 'Queues', description: 'Background jobs and message processing', pinned: false },
  { name: 'Realtime', description: 'Broadcast, presence, and database changes', pinned: false },
  {
    name: 'Supabase Platform',
    description: 'Project settings, billing, and infrastructure',
    pinned: false,
  },
] as const

export type Topic = (typeof TOPICS)[number]['name']

// zod's `enum()` needs a literal non-empty tuple of strings, which `.map()`
// can't preserve on its own — this cast is safe because TOPICS is `as const`.
export const TOPIC_NAMES = TOPICS.map((topic) => topic.name) as [Topic, ...Topic[]]

export function getTopicDescription(topic: Topic): string {
  return TOPICS.find((t) => t.name === topic)!.description
}

// URL-safe slug for a topic, e.g. "Edge Functions" -> "edge-functions".
export function topicToSlug(topic: Topic): string {
  return topic.toLowerCase().replace(/\s+/g, '-')
}

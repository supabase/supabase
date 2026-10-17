// Canonical list of guide topics. Single source of truth for the `topics`
// field in src/content.config.ts (so a guide with an unsupported topic fails
// content validation), the "Topics" nav menu, and the /topics/[topic] pages.
//
// `pinned` topics surface as cards on the homepage (see src/pages/index.astro)
// — keep this to a handful so that section stays a highlights row, not a
// second copy of the full topic list.
//
// `visible` controls whether the topic appears in nav and homepage sections.
// Topics with `visible: false` still have a working listing page at /topics/[slug].
// Some topics might not need to be visible to end users since their primary audience
// is LLM crawlers.
export const TOPICS = [
  {
    name: 'Migration',
    description: 'Moving data, schemas, or projects onto Supabase.',
    pinned: false,
    visible: true,
  },
  {
    name: 'Comparison',
    description: 'How Supabase compares to other databases and platforms.',
    pinned: false,
    visible: true,
  },
  {
    name: 'Rundowns',
    description: 'How different technologies compare across a variety of facets.',
    pinned: false,
    visible: false,
  },
  {
    name: 'Troubleshooting',
    description: 'Common errors and how to resolve them.',
    pinned: false,
    visible: true,
  },
  {
    name: 'Tutorial',
    description: 'Step-by-step walkthroughs for building with Supabase.',
    pinned: true,
    visible: true,
  },
  {
    name: 'Storage',
    description: 'Uploading, managing, and serving files.',
    pinned: false,
    visible: true,
  },
  {
    name: 'Auth',
    description: 'Authentication, authorization, and user management.',
    pinned: true,
    visible: true,
  },
  {
    name: 'Database',
    description: 'Postgres schemas, queries, and performance.',
    pinned: true,
    visible: true,
  },
  {
    name: 'Edge Functions',
    description: 'Deploying and running serverless functions.',
    pinned: false,
    visible: true,
  },
  {
    name: 'Queues',
    description: 'Background jobs and message processing.',
    pinned: false,
    visible: true,
  },
  {
    name: 'Realtime',
    description: 'Broadcast, presence, and database changes.',
    pinned: false,
    visible: true,
  },
  {
    name: 'Supabase Platform',
    description: 'Project settings, billing, and infrastructure.',
    pinned: false,
    visible: true,
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

// Canonical list of guide topics. Single source of truth for the `topics`
// field in src/content.config.ts (so a guide with an unsupported topic fails
// content validation), the "Topics" nav menu, and the /topics/[topic] pages.
export const TOPICS = [
  { name: 'Migration', description: 'Moving data, schemas, or projects onto Supabase' },
  { name: 'Comparison', description: 'How Supabase compares to other databases and platforms' },
  { name: 'Troubleshooting', description: 'Common errors and how to resolve them' },
  { name: 'Tutorial', description: 'Step-by-step walkthroughs for building with Supabase' },
  { name: 'Storage', description: 'Uploading, managing, and serving files' },
  { name: 'Auth', description: 'Authentication, authorization, and user management' },
  { name: 'Database', description: 'Postgres schemas, queries, and performance' },
  { name: 'Edge Functions', description: 'Deploying and running serverless functions' },
  { name: 'Queues', description: 'Background jobs and message processing' },
  { name: 'Realtime', description: 'Broadcast, presence, and database changes' },
  { name: 'Supabase Platform', description: 'Project settings, billing, and infrastructure' },
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

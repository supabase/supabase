import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

import { TOPICS, topicToSlug } from '../lib/topics'

const SITE_URL = 'https://supabase.com/kb'

export const GET: APIRoute = async () => {
  const guides = await getCollection('guides')
  const guideLines = guides.map(
    (guide) =>
      `- [${guide.data.title}](${SITE_URL}/guides/${guide.id}.md): ${guide.data.description}`
  )
  const topicLines = TOPICS.map(
    (topic) =>
      `- [${topic.name}](${SITE_URL}/topics/${topicToSlug(topic.name)}.md): ${topic.description}`
  )

  const body = [
    '# Supabase Knowledge Base',
    '',
    '> In-depth guides, tutorials, and explainers for best practices for Supabase databases. Every link below is the plain markdown version of a page.',
    '',
    '## Guides',
    '',
    ...guideLines,
    '',
    '## Topics',
    '',
    ...topicLines,
    '',
  ].join('\n')

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

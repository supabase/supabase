import { AGENT_RESOURCES } from '@/lib/agent-resources'
import { fetchDocsMarkdown } from '@/lib/docs-markdown'

export const dynamic = 'force-dynamic'

export async function GET() {
  // The docs sitemap's own title is dropped, its links sit under "## Documentation" here.
  const docsLinks = (await fetchDocsMarkdown('sitemap.md'))?.replace(/^# .*\n+/, '').trim()

  const agentResourceLinks = AGENT_RESOURCES.map(
    (resource) => `- [${resource.title}](${resource.url}): ${resource.description}`
  ).join('\n')

  const content = [
    '# Supabase Docs',
    '',
    'For the complete documentation in a single file, see [Full Documentation](https://supabase.com/llms-full.txt).',
    '',
    '## Documentation',
    '',
    ...(docsLinks ? [docsLinks, ''] : []),
    '- [Knowledge Base](https://supabase.com/kb/sitemap.md)',
    '- [Customer Stories](https://supabase.com/customers.md)',
    '',
    '## Pricing',
    '',
    '- [Supabase Pricing](https://supabase.com/pricing.md)',
    '',
    '## Product overviews',
    '',
    '- [Supabase overview](https://supabase.com/index.md)',
    '- [Database](https://supabase.com/database.md): dedicated Postgres, usable on its own with any Postgres client or ORM',
    '- [Auth](https://supabase.com/auth.md)',
    '- [Storage](https://supabase.com/storage.md)',
    '- [Realtime](https://supabase.com/realtime.md)',
    '- [Edge Functions](https://supabase.com/edge-functions.md)',
    '- [Cron](https://supabase.com/modules/cron.md)',
    '- [Queues](https://supabase.com/modules/queues.md)',
    '- [Vector](https://supabase.com/modules/vector.md)',
    '',
    '## API and agent resources',
    '',
    agentResourceLinks,
  ].join('\n')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

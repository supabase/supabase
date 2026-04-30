import { isFeatureEnabled } from 'common/enabled-features'

export const dynamic = 'force-dynamic'

interface Source {
  title: string
  relPath: string
  enabled: boolean
}

function getSources(): Source[] {
  const { sdkCsharp, sdkDart, sdkKotlin, sdkPython, sdkSwift } = isFeatureEnabled([
    'sdk:csharp',
    'sdk:dart',
    'sdk:kotlin',
    'sdk:python',
    'sdk:swift',
  ])

  return [
    { title: 'Supabase Guides', relPath: 'llms/guides.txt', enabled: true },
    { title: 'Supabase Reference (JavaScript)', relPath: 'llms/js.txt', enabled: true },
    { title: 'Supabase Reference (Dart)', relPath: 'llms/dart.txt', enabled: sdkDart },
    { title: 'Supabase Reference (Swift)', relPath: 'llms/swift.txt', enabled: sdkSwift },
    { title: 'Supabase Reference (Kotlin)', relPath: 'llms/kotlin.txt', enabled: sdkKotlin },
    { title: 'Supabase Reference (Python)', relPath: 'llms/python.txt', enabled: sdkPython },
    { title: 'Supabase Reference (C#)', relPath: 'llms/csharp.txt', enabled: sdkCsharp },
    { title: 'Supabase CLI Reference', relPath: 'llms/cli.txt', enabled: true },
  ]
}

// Editorial ordering for the product overview list (mirrors the homepage
// products section); not derived from MD_PAGES because the order is
// intentional. When dropping a new content/md/<slug>.md file, add a matching
// entry here too — otherwise the page ships but won't be linked from /llms.txt.
const PRODUCT_OVERVIEW_LINKS = [
  '- [Supabase Overview](https://supabase.com/homepage.md)',
  '- [Supabase Database](https://supabase.com/database.md)',
  '- [Supabase Auth](https://supabase.com/auth.md)',
  '- [Supabase Storage](https://supabase.com/storage.md)',
  '- [Supabase Edge Functions](https://supabase.com/edge-functions.md)',
  '- [Supabase Realtime](https://supabase.com/realtime.md)',
  '- [Supabase Vector](https://supabase.com/vector.md)',
  '- [Supabase Cron](https://supabase.com/modules/cron.md)',
  '- [Supabase Queues](https://supabase.com/modules/queues.md)',
  '- [Supabase Pricing](https://supabase.com/pricing.md)',
].join('\n')

export async function GET() {
  const sources = getSources()

  const sourceLinks = sources
    .filter((source) => source.enabled)
    .map((source) => `- [${source.title}](https://supabase.com/${source.relPath})`)
    .join('\n')

  const content = [
    '# Supabase Docs',
    '',
    'For the complete documentation in a single file, see [Full Documentation](https://supabase.com/llms-full.txt).',
    '',
    '## Documentation',
    '',
    sourceLinks,
    '',
    '## Product Overview',
    '',
    PRODUCT_OVERVIEW_LINKS,
  ].join('\n')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

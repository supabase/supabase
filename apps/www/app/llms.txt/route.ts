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

const PRODUCT_OVERVIEW_LINKS = [
  '- [Supabase Overview](https://supabase.com/llms/homepage.txt)',
  '- [Supabase Database](https://supabase.com/llms/database.txt)',
  '- [Supabase Auth](https://supabase.com/llms/auth.txt)',
  '- [Supabase Storage](https://supabase.com/llms/storage.txt)',
  '- [Supabase Edge Functions](https://supabase.com/llms/edge-functions.txt)',
  '- [Supabase Realtime](https://supabase.com/llms/realtime.txt)',
  '- [Supabase Vector](https://supabase.com/llms/vector.txt)',
  '- [Supabase Pricing](https://supabase.com/llms/pricing.txt)',
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

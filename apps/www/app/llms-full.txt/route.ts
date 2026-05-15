import { isFeatureEnabled } from 'common/enabled-features'

import { MD_CONTENT } from '@/app/api-v2/md/content.generated'
import { generatePricingContent } from '@/lib/llms'

export const dynamic = 'force-dynamic'

interface Source {
  title: string
  slug: string
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
    { title: 'Supabase Guides', slug: 'guides', enabled: true },
    { title: 'Supabase Reference (JavaScript)', slug: 'js', enabled: true },
    { title: 'Supabase Reference (Dart)', slug: 'dart', enabled: sdkDart },
    { title: 'Supabase Reference (Swift)', slug: 'swift', enabled: sdkSwift },
    { title: 'Supabase Reference (Kotlin)', slug: 'kotlin', enabled: sdkKotlin },
    { title: 'Supabase Reference (Python)', slug: 'python', enabled: sdkPython },
    { title: 'Supabase Reference (C#)', slug: 'csharp', enabled: sdkCsharp },
    { title: 'Supabase CLI Reference', slug: 'cli', enabled: true },
  ]
}

// Order is set by scripts/generateMdContent.mjs (homepage first, rest
// alphabetical). pricing is appended here since it's dynamic.
async function readProductOverviews(): Promise<string> {
  const staticContents = [...MD_CONTENT.values()]
  const pricingContent = generatePricingContent()

  return [...staticContents, pricingContent].join('\n\n---\n\n')
}

async function fetchSourceContent(slug: string): Promise<string | null> {
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL
  if (!docsUrl) return null

  const response = await fetch(`${docsUrl}/llms/${slug}.txt`)
  if (!response.ok) return null

  return response.text()
}

export async function GET() {
  const sources = getSources()
  const enabledSources = sources.filter((source) => source.enabled)

  const [productContent, ...sourceContents] = await Promise.all([
    readProductOverviews(),
    ...enabledSources.map(async (source) => {
      const text = await fetchSourceContent(source.slug)
      return { title: source.title, text }
    }),
  ])

  const docsSection = sourceContents
    .filter((s): s is { title: string; text: string } => s.text !== null)
    .map(({ title, text }) => `# ${title}\n\n${text}`)
    .join('\n\n---\n\n')

  const content = [
    '# Supabase',
    '',
    '## Product Overview',
    '',
    productContent,
    '',
    '---',
    '',
    '## Documentation',
    '',
    docsSection,
  ].join('\n')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

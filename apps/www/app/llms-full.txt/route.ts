import { promises as fs } from 'node:fs'
import path from 'node:path'
import { isFeatureEnabled } from 'common/enabled-features'

import { generatePricingContent } from '@/lib/llms'

export const dynamic = 'force-dynamic'

interface Source {
  title: string
  slug: string
  enabled: boolean
}

/**
 * Resolved relative to apps/www (process.cwd() at runtime). The directory is
 * included in the serverless bundle via outputFileTracingIncludes in
 * next.config.mjs so reads work on Vercel.
 */
const GUIDES_MD_DIR = path.join(process.cwd(), '..', 'docs', 'public', 'markdown', 'guides')

function getSources(): Source[] {
  const { sdkCsharp, sdkDart, sdkKotlin, sdkPython, sdkSwift } = isFeatureEnabled([
    'sdk:csharp',
    'sdk:dart',
    'sdk:kotlin',
    'sdk:python',
    'sdk:swift',
  ])

  return [
    { title: 'Supabase Reference (JavaScript)', slug: 'js', enabled: true },
    { title: 'Supabase Reference (Dart)', slug: 'dart', enabled: sdkDart },
    { title: 'Supabase Reference (Swift)', slug: 'swift', enabled: sdkSwift },
    { title: 'Supabase Reference (Kotlin)', slug: 'kotlin', enabled: sdkKotlin },
    { title: 'Supabase Reference (Python)', slug: 'python', enabled: sdkPython },
    { title: 'Supabase Reference (C#)', slug: 'csharp', enabled: sdkCsharp },
    { title: 'Supabase Server SDK Reference', slug: 'server', enabled: true },
    { title: 'Supabase SSR Reference', slug: 'ssr', enabled: true },
    { title: 'Supabase CLI Reference', slug: 'cli', enabled: true },
    { title: 'Supabase Management API Reference', slug: 'api', enabled: true },
  ]
}

async function readAllGuideMarkdown(): Promise<string> {
  const entries = await fs.readdir(GUIDES_MD_DIR, { recursive: true, withFileTypes: true })
  const mdFilePaths = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort()

  const contents = await Promise.all(mdFilePaths.map((filePath) => fs.readFile(filePath, 'utf-8')))
  return contents.join('\n\n---\n\n')
}

async function fetchSourceContent(slug: string): Promise<string | null> {
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL
  if (!docsUrl) return null

  const response = await fetch(`${docsUrl}/markdown/reference/${slug}.md`)
  if (!response.ok) return null

  return response.text()
}

export async function GET() {
  const sources = getSources()
  const enabledSources = sources.filter((source) => source.enabled)

  const pricingContent = generatePricingContent()

  const [guidesContent, ...sourceContents] = await Promise.all([
    readAllGuideMarkdown(),
    ...enabledSources.map(async (source) => {
      const text = await fetchSourceContent(source.slug)
      return { title: source.title, text }
    }),
  ])

  const referenceSection = sourceContents
    .filter((s): s is { title: string; text: string } => s.text !== null)
    .map(({ title, text }) => `# ${title}\n\n${text}`)
    .join('\n\n---\n\n')

  const docsSection = [`# Supabase Guides\n\n${guidesContent}`, referenceSection].join(
    '\n\n---\n\n'
  )

  const content = [
    '# Supabase',
    '',
    '## Pricing',
    '',
    pricingContent,
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

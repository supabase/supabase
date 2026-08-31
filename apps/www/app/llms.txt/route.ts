import { promises as fs } from 'node:fs'
import path from 'node:path'
import { isFeatureEnabled } from 'common/enabled-features'
import matter from 'gray-matter'

export const dynamic = 'force-dynamic'

interface Source {
  title: string
  relPath: string
  enabled: boolean
}

/**
 * Resolved relative to apps/www (process.cwd() at runtime). The directory is
 * included in the serverless bundle via outputFileTracingIncludes in
 * next.config.mjs so this readdir works on Vercel.
 */
const GUIDES_CONTENT_DIR = path.join(process.cwd(), '..', 'docs', 'content', 'guides')

async function readFrontmatterTitle(dirName: string): Promise<string | null> {
  try {
    const mdxPath = path.join(GUIDES_CONTENT_DIR, `${dirName}.mdx`)
    const raw = await fs.readFile(mdxPath, 'utf-8')
    const { data } = matter(raw)
    return typeof data.title === 'string' && data.title.length > 0 ? data.title : null
  } catch {
    return null
  }
}

async function getGuideSources(): Promise<Source[]> {
  const entries = await fs.readdir(GUIDES_CONTENT_DIR, { withFileTypes: true })
  const dirNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  return Promise.all(
    dirNames.map(async (dirName) => {
      const frontmatterTitle = await readFrontmatterTitle(dirName)
      return {
        title: `Supabase - ${frontmatterTitle ?? dirName}`,
        relPath: `docs/guides/${dirName}.md`,
        enabled: true,
      }
    })
  )
}

async function getSources(): Promise<Source[]> {
  const { sdkCsharp, sdkDart, sdkKotlin, sdkPython, sdkSwift } = isFeatureEnabled([
    'sdk:csharp',
    'sdk:dart',
    'sdk:kotlin',
    'sdk:python',
    'sdk:swift',
  ])

  const guideSources = await getGuideSources()

  return [
    ...guideSources,
    { title: 'Supabase Reference (JavaScript)', relPath: 'llms/js.txt', enabled: true },
    { title: 'Supabase Reference (Dart)', relPath: 'llms/dart.txt', enabled: sdkDart },
    { title: 'Supabase Reference (Swift)', relPath: 'llms/swift.txt', enabled: sdkSwift },
    { title: 'Supabase Reference (Kotlin)', relPath: 'llms/kotlin.txt', enabled: sdkKotlin },
    { title: 'Supabase Reference (Python)', relPath: 'llms/python.txt', enabled: sdkPython },
    { title: 'Supabase Reference (C#)', relPath: 'llms/csharp.txt', enabled: sdkCsharp },
    { title: 'Supabase Server SDK Reference', relPath: 'llms/server.txt', enabled: true },
    { title: 'Supabase CLI Reference', relPath: 'llms/cli.txt', enabled: true },
    { title: 'Supabase Management API Reference', relPath: 'llms/api.txt', enabled: true },
  ]
}

export async function GET() {
  const sources = await getSources()

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
    '## Pricing',
    '',
    '- [Supabase Pricing](https://supabase.com/pricing.md)',
  ].join('\n')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

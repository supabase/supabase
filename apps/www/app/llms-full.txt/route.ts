import { fetchDocsMarkdown } from '@/lib/docs-markdown'
import { generatePricingContent } from '@/lib/llms'

export const dynamic = 'force-dynamic'

export async function GET() {
  const docsContent = await fetchDocsMarkdown('full.md')

  const content = [
    '# Supabase',
    '',
    '## Pricing',
    '',
    generatePricingContent(),
    ...(docsContent ? ['', '---', '', '## Documentation', '', docsContent] : []),
  ].join('\n')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

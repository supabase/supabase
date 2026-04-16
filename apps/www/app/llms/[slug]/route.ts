import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { generatePricingContent } from '@/lib/llms'

export const dynamic = 'force-dynamic'

function textResponse(content: string) {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!slug.endsWith('.txt')) {
    return new Response('Not Found', { status: 404 })
  }

  // 1. Check for dynamically generated content (e.g. pricing)
  if (slug === 'pricing.txt') {
    return textResponse(generatePricingContent())
  }

  // 2. Check for a local static file in public/llms/
  try {
    const filePath = join(process.cwd(), 'data/llms', slug)
    const content = await readFile(filePath, 'utf-8')
    return textResponse(content)
  } catch {
    // File doesn't exist locally, fall through
  }

  // 3. Try fetching from the docs app
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL
  if (docsUrl) {
    const response = await fetch(`${docsUrl}/llms/${slug}`)
    if (response.ok) {
      const content = await response.text()
      return textResponse(content)
    }
  }

  return new Response('Not Found', { status: 404 })
}

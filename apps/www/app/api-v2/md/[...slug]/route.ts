import { NextResponse } from 'next/server'

import { MD_CONTENT } from '../content.generated'
import { generatePricingContent } from '@/lib/llms'
import { buildMarkdown404Body, MARKDOWN_404_HEADERS } from '@/lib/markdown-404'

// Static .md files are bundled at build time, so they're safe to cache at the
// edge for a day. Without s-maxage Vercel's CDN won't cache the response and
// every request would hit the lambda.
const STATIC_HEADERS = {
  'Content-Type': 'text/markdown; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
  Vary: 'Accept',
}

// Pricing is generated dynamically from shared-data without a content rebuild,
// so use a shorter edge cache to match /llms.txt and /llms-full.txt.
const DYNAMIC_HEADERS = {
  'Content-Type': 'text/markdown; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  Vary: 'Accept',
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const slugPath = slug.join('/')

  if (slugPath === 'pricing') {
    return new NextResponse(generatePricingContent(), { headers: DYNAMIC_HEADERS })
  }

  const content = MD_CONTENT.get(slugPath)
  if (!content) {
    return new NextResponse(buildMarkdown404Body(`/${slugPath}.md`), {
      status: 404,
      headers: MARKDOWN_404_HEADERS,
    })
  }

  return new NextResponse(content, { headers: STATIC_HEADERS })
}

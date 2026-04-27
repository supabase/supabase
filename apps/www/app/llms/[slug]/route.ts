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

// Product overview slugs and pricing.txt are 301-redirected to /<slug>.md in
// apps/www/lib/redirects.js, so this handler typically only sees per-SDK
// reference files. The pricing branch stays as a fallback in case the redirect
// is bypassed.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!slug.endsWith('.txt')) {
    return new Response('Not Found', { status: 404 })
  }

  if (slug === 'pricing.txt') {
    return textResponse(generatePricingContent())
  }

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

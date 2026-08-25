import { negotiateMarkdown } from 'common/markdown-negotiation'
import { NextResponse, type NextRequest } from 'next/server'

import MARKDOWN_SLUGS from './public/markdown/manifest.json'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/library'
const DOCS_PATH = `${BASE_PATH}/docs`
const MARKDOWN_SLUG_SET = new Set(MARKDOWN_SLUGS)

export function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const { pathname } = url

  if (!pathname.startsWith(`${DOCS_PATH}/`)) {
    return NextResponse.next()
  }

  const isMdSuffix = pathname.endsWith('.md')
  const slug = pathname.replace(`${DOCS_PATH}/`, '').replace(/\.md$/, '')
  const decision = negotiateMarkdown(
    { acceptHeader: request.headers.get('accept') ?? '' },
    { hasMarkdownVariant: MARKDOWN_SLUG_SET.has(slug), isMarkdownSuffix: isMdSuffix }
  )

  if (decision === 'not-acceptable') {
    return new NextResponse('Not Acceptable', {
      status: 406,
      headers: { 'Cache-Control': 'no-store', Vary: 'Accept' },
    })
  }

  if (decision === 'markdown') {
    const rewriteUrl = new URL(url)
    rewriteUrl.pathname = `${BASE_PATH}/api/docs-md/${slug}`
    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/docs/:path*'],
}

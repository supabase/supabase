import { negotiateMarkdown } from 'common/markdown-negotiation'
import { NextResponse } from 'next/server'

import { buildMarkdown404Body, MARKDOWN_404_HEADERS } from '@/lib/markdown-404'

export async function GET(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  const requestPath = '/' + (path ?? []).join('/')
  const isMarkdownSuffix = requestPath.endsWith('.md')

  const decision = negotiateMarkdown(
    { acceptHeader: request.headers.get('accept') ?? '' },
    { hasMarkdownVariant: true, isMarkdownSuffix }
  )

  if (decision === 'markdown') {
    return new NextResponse(buildMarkdown404Body(requestPath), {
      status: 404,
      headers: MARKDOWN_404_HEADERS,
    })
  }

  return new NextResponse('Not found', {
    status: 404,
    headers: { ...MARKDOWN_404_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

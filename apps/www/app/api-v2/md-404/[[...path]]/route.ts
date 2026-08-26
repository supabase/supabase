import { NextResponse } from 'next/server'

import { buildMarkdown404Body, MARKDOWN_404_HEADERS } from '@/lib/markdown-404'

export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  const requestPath = '/' + (path ?? []).join('/')

  return new NextResponse(buildMarkdown404Body(requestPath), {
    status: 404,
    headers: MARKDOWN_404_HEADERS,
  })
}

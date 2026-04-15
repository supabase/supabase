import { NextResponse } from 'next/server'

import { MD_CONTENT } from '../content.generated'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const slugPath = slug.join('/')

  const content = MD_CONTENT.get(slugPath)
  if (!content) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      Vary: 'Accept',
    },
  })
}

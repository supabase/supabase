import { promises as fs } from 'fs'
import path from 'path'
import { BASE_PATH } from '~/lib/constants'
import { NextResponse } from 'next/server'

const BASE_DIR = path.join(process.cwd(), 'public/docs')

export async function GET(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const slugPath = slug.join('/')

  // Resolve candidate paths: exact match first, then index fallback for directory-style routes
  const candidates = [
    path.join(BASE_DIR, `${slugPath}.md`),
    path.join(BASE_DIR, slugPath, 'index.md'),
  ]

  for (const filePath of candidates) {
    // Prevent path traversal
    if (!filePath.startsWith(BASE_DIR + path.sep)) continue

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        },
      })
    } catch {
      // Try next candidate
    }
  }

  // Markdown file not found — redirect to the original page so HTML is served instead.
  // nomd=1 tells the middleware to skip markdown interception and avoid an infinite loop.
  const pageUrl = new URL(`${BASE_PATH ?? ''}/${slugPath}`, request.url)
  pageUrl.searchParams.set('nomd', '1')
  return NextResponse.redirect(pageUrl, { status: 302 })
}

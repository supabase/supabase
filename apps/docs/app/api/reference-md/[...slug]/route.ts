import { promises as fs } from 'node:fs'
import path from 'node:path'
import REFERENCE_MANIFEST from '~/public/markdown/reference-manifest.json'
import { NextResponse } from 'next/server'

const SECTIONS_DIR = path.join(process.cwd(), 'public/markdown/reference-sections')

const MANIFEST: Record<string, string> = REFERENCE_MANIFEST

const markdownResponse = (body: string, init: ResponseInit & { cache: string }) =>
  new NextResponse(body, {
    ...init,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': init.cache,
      Vary: 'Accept',
    },
  })

const notFound = (requestPath: string) =>
  markdownResponse(
    `# 404 - Page not found\n\nThe reference section \`/docs/reference/${requestPath}.md\` does not exist.\n\nSee the [reference index](/docs/reference.md).\n`,
    { status: 404, cache: 'no-store' }
  )

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const requestPath = slug.join('/')

  const artifact = MANIFEST[requestPath]
  if (!artifact) return notFound(requestPath)

  const filePath = path.join(SECTIONS_DIR, `${artifact}.md`)
  if (!filePath.startsWith(SECTIONS_DIR + path.sep)) return notFound(requestPath)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return markdownResponse(content, {
      cache: 'public, max-age=86400, stale-while-revalidate=3600',
    })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`Reference section manifest hit but file missing: ${filePath}`)
    } else {
      console.error(`Failed to read reference section ${filePath}:`, err)
    }
    return markdownResponse(
      '# 500 - Server error\n\nThis reference section could not be read. Try again shortly.\n',
      { status: 500, cache: 'no-store' }
    )
  }
}

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const baseDir = path.join(process.cwd(), 'public/markdown/docs')
  const filePath = path.join(baseDir, `${slug.join('/')}.md`)

  if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
    return markdownNotFound(slug)
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        Vary: 'Accept',
      },
    })
  } catch {
    return markdownNotFound(slug)
  }
}

function markdownNotFound(slug: string[]) {
  const pagePath = slug.join('/')
  const markdown = `# 404 - Page Not Found

The page \`/library/docs/${pagePath}.md\` does not exist.

See also: [Supabase Library](https://supabase.com/library/llms.txt)
`
  return new NextResponse(markdown, {
    status: 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

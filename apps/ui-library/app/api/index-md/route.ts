import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'

export async function GET() {
  const filePath = path.join(process.cwd(), 'public/markdown/index.md')

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
    return new NextResponse(
      `# Supabase Library\n\nThe block catalog is unavailable.\n\nSee also: [Supabase Library](https://supabase.com/library/llms.txt)\n`,
      {
        status: 404,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store' },
      }
    )
  }
}

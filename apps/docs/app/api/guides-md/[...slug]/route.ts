import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const baseDir = path.join(process.cwd(), 'public/docs/guides')
  const filePath = path.join(baseDir, `${slug.join('/')}.md`)

  if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}

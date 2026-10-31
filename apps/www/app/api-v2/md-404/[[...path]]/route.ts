import { NextResponse } from 'next/server'

const MARKDOWN_404_HEADERS = {
  'Content-Type': 'text/markdown; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  Vary: 'Accept',
}

function buildMarkdown404Body(requestPath: string): string {
  const safePath = requestPath.replace(/[^\x20-\x7E]/g, '').replaceAll('`', '')
  return `# 404 Not Found

\`${safePath}\` does not exist on supabase.com.

Explore instead:

- [Documentation](https://supabase.com/docs)
- [Sitemap](https://supabase.com/sitemap.xml)
- [llms.txt](https://supabase.com/llms.txt)
`
}

export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params
  return new NextResponse(buildMarkdown404Body('/' + (path ?? []).join('/')), {
    status: 404,
    headers: MARKDOWN_404_HEADERS,
  })
}

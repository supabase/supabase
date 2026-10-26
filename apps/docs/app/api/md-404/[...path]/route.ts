import { clientSdkIds } from '~/content/navigation.references'
import { BASE_PATH, PROD_URL } from '~/lib/constants'
import { NextResponse } from 'next/server'

const REFERENCE_MARKDOWN_LIBS = new Set([...clientSdkIds, 'cli', 'api'])
const LLMS_FILE_NAMES: Record<string, string> = { javascript: 'js' }

function markdownUrl(section: string, lib: string | undefined) {
  if (section !== 'reference' || !lib || !REFERENCE_MARKDOWN_LIBS.has(lib)) {
    return 'https://supabase.com/llms.txt'
  }
  return `https://supabase.com/llms/${LLMS_FILE_NAMES[lib] ?? lib}.txt`
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const relativePath = path.map(encodeURIComponent).join('/').replace(/\.md$/, '')
  const [section, lib] = relativePath.split('/')

  const markdown = `# 404 Not Found

There is no markdown version of \`${BASE_PATH}/${relativePath}\`.

- HTML page: ${PROD_URL}/${relativePath}
- Markdown: ${markdownUrl(section, lib)}
`

  return new NextResponse(markdown, {
    status: 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

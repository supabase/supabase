import { promises as fs } from 'node:fs'
import path from 'node:path'
import { BASE_PATH } from '~/lib/constants'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const baseDir = path.join(process.cwd(), 'public/docs/guides')
  const filePath = path.join(baseDir, `${slug.join('/')}.md`)

  if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
    return notFoundResponse(request, slug)
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch {
    return notFoundResponse(request, slug)
  }
}

async function notFoundResponse(request: Request, slug: string[]) {
  const { origin } = new URL(request.url)
  const baseUrl = `${origin}${BASE_PATH}`
  const query = slug.join(' ').replace(/[_-]/g, ' ')
  const suggestions = await searchForSuggestions(baseUrl, query)
  const markdown = buildNotFoundMarkdown(slug, suggestions)
  return new NextResponse(markdown, {
    status: 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

interface SearchSuggestion {
  title: string
  href: string
}

async function searchForSuggestions(baseUrl: string, query: string): Promise<SearchSuggestion[]> {
  try {
    const response = await fetch(`${baseUrl}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query SearchDocs($query: String!) {
            searchDocs(query: $query, limit: 5) {
              nodes {
                title
                href
              }
            }
          }
        `,
        variables: { query },
      }),
    })

    if (!response.ok) return []

    const data = await response.json()
    return (data?.data?.searchDocs?.nodes ?? []).filter(
      (n: Partial<SearchSuggestion>): n is SearchSuggestion => !!n.title && !!n.href
    )
  } catch {
    return []
  }
}

function buildNotFoundMarkdown(slug: string[], suggestions: SearchSuggestion[]): string {
  const pagePath = slug.join('/')

  const suggestionsMd =
    suggestions.length > 0
      ? `## You might be looking for...\n\n${suggestions
          .map(({ title, href }) => `- [${title}](${href})`)
          .join('\n')}\n`
      : ''

  return `# 404 - Page Not Found

The page \`/docs/guides/${pagePath}.md\` does not exist.

${suggestionsMd}
See also: [Changelog](https://supabase.com/changelog.md)
`
}

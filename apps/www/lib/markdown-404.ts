export const MARKDOWN_404_HEADERS = {
  'Content-Type': 'text/markdown; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  Vary: 'Accept',
}

function sanitizePathForCodeSpan(requestPath: string): string {
  return requestPath.replace(/[^\x20-\x7E]/g, '').replaceAll('`', '')
}

export function buildMarkdown404Body(requestPath: string): string {
  return `# 404 Not Found

\`${sanitizePathForCodeSpan(requestPath)}\` does not exist on supabase.com.

Explore instead:

- [Documentation](https://supabase.com/docs)
- [Sitemap](https://supabase.com/sitemap.xml)
- [llms.txt](https://supabase.com/llms.txt)
`
}

import { describe, expect, it } from 'vitest'

import { GET } from './app/api-v2/md-404/[[...path]]/route'
import { buildMarkdown404Body } from './lib/markdown-404'

function getMd404(accept: string, path?: string[]) {
  return GET(new Request('http://localhost/api-v2/md-404', { headers: { accept } }), {
    params: Promise.resolve({ path }),
  })
}

describe('md-404 route handler', () => {
  it('serves a markdown 404 with recovery pointers when the client prefers markdown', async () => {
    const res = await getMd404('text/markdown', ['some-path'])
    const body = await res.text()

    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('Vary')).toBe('Accept')
    expect(body).toContain('`/some-path` does not exist')
    expect(body).toContain('https://supabase.com/docs')
    expect(body).toContain('https://supabase.com/sitemap.xml')
    expect(body).toContain('https://supabase.com/llms.txt')
  })

  it('serves a markdown 404 for .md paths regardless of Accept', async () => {
    const res = await getMd404('*/*', ['foo.md'])

    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
    expect(await res.text()).toContain('`/foo.md` does not exist')
  })

  it('serves the markdown 404 regardless of q-values (the rewrite gate owns Accept matching)', async () => {
    const res = await getMd404('text/markdown;q=0, text/html', ['some-path'])

    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
  })

  it('handles a missing path param and echoes the root path', async () => {
    const res = await getMd404('text/markdown')

    expect(res.status).toBe(404)
    expect(await res.text()).toContain('`/` does not exist')
  })
})

describe('buildMarkdown404Body', () => {
  it('strips backticks and non-printable characters from the echoed path', () => {
    const body = buildMarkdown404Body('/a`b\nc')

    expect(body).toContain('`/abc` does not exist')
  })
})

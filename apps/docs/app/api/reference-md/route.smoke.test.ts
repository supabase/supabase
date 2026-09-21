import { describe, expect, it } from 'vitest'

const DOCS_BASE_URL = process.env.DOCS_SMOKE_URL ?? 'https://supabase.com'
const REFERENCE_URL = `${DOCS_BASE_URL}/docs/reference`

const fetchMarkdown = async (sectionPath: string, init?: RequestInit) => {
  const response = await fetch(`${REFERENCE_URL}/${sectionPath}.md`, init)
  return { response, body: await response.text() }
}

const expectMarkdown = (response: Response) => {
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('text/markdown')
}

const SECTIONS: Array<{ sectionPath: string; contains: string; excludes?: string }> = [
  { sectionPath: 'javascript/select', contains: 'SELECT', excludes: '# insert' },
  { sectionPath: 'javascript/v1/start', contains: 'supabase-js' },
  { sectionPath: 'dart/select', contains: 'select' },
  { sectionPath: 'csharp/select', contains: 'select' },
  { sectionPath: 'swift/select', contains: 'select' },
  { sectionPath: 'kotlin/select', contains: 'select' },
  { sectionPath: 'python/select', contains: 'select' },
  { sectionPath: 'server/introduction', contains: 'server' },
  { sectionPath: 'middleware/installing', contains: 'middleware' },
  { sectionPath: 'cli/global-flags', contains: '--debug', excludes: '# supabase link' },
  {
    sectionPath: 'api/v1-create-a-project',
    contains: 'POST /v1/projects',
    excludes: '# Delete a project',
  },
  {
    sectionPath: 'self-hosting-auth/generates-an-email-action-link',
    contains: '/admin/generate_link',
  },
  { sectionPath: 'self-hosting-analytics/introduction', contains: 'Analytics' },
  { sectionPath: 'self-hosting-storage/introduction', contains: 'Storage' },
  { sectionPath: 'self-hosting-functions/introduction', contains: 'Functions' },
  { sectionPath: 'self-hosting-realtime/introduction', contains: 'Realtime' },
]

describe('prod smoke test: reference section markdown', () => {
  it.each(SECTIONS)('serves $sectionPath', async ({ sectionPath, contains, excludes }) => {
    const { response, body } = await fetchMarkdown(sectionPath)

    expectMarkdown(response)
    expect(body).toContain(contains)
    if (excludes) expect(body).not.toContain(excludes)
  })

  it('serves the introduction alone at start, introduction, and the explicit version', async () => {
    const [start, introduction, versioned] = await Promise.all([
      fetchMarkdown('javascript/start'),
      fetchMarkdown('javascript/introduction'),
      fetchMarkdown('javascript/v2/introduction'),
    ])

    expectMarkdown(start.response)
    expect(start.body).toContain('supabase-js')
    expect(start.body).not.toContain('# Installing')
    expect(introduction.body).toBe(start.body)
    expect(versioned.body).toBe(start.body)
  })

  it('lists section links at a bare family URL instead of the whole library', async () => {
    const { response, body } = await fetchMarkdown('javascript')

    expectMarkdown(response)
    expect(body).toContain('/docs/reference/javascript/select.md)')
    expect(body).toContain('/docs/reference/javascript/v1.md)')
    expect(body.length).toBeLessThan(50_000)
  })

  it('returns a small markdown 404 for unknown sections, families, and versions', async () => {
    for (const sectionPath of ['javascript/unknown', 'unknown/thing', 'javascript/v9']) {
      const { response, body } = await fetchMarkdown(sectionPath)

      expect(response.status).toBe(404)
      expect(response.headers.get('content-type')).toContain('text/markdown')
      expect(response.headers.get('cache-control')).toContain('no-store')
      // A whole-library fallback would be far larger.
      expect(body.length).toBeLessThan(2000)
    }
  })

  it('serves markdown without the suffix when Accept prefers it, and HTML to browsers', async () => {
    const url = `${REFERENCE_URL}/javascript/select`
    const [agent, browser] = await Promise.all([
      fetch(url, { headers: { accept: 'text/markdown, text/html;q=0.9' } }),
      fetch(url, { headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } }),
    ])

    expectMarkdown(agent)
    expect(browser.headers.get('content-type')).toContain('text/html')
  })

  it('advertises the markdown alternate on the crawler page and on the library page', async () => {
    const [crawler, library] = await Promise.all([
      fetch(`${REFERENCE_URL}/javascript/select`, { headers: { 'user-agent': 'Claude-User/1.0' } }),
      fetch(`${REFERENCE_URL}/javascript`, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/126' } }),
    ])

    expect(await crawler.text()).toContain(
      'type="text/markdown" href="https://supabase.com/docs/reference/javascript/select.md"'
    )
    expect(await library.text()).toContain(
      'type="text/markdown" href="https://supabase.com/docs/reference/javascript.md"'
    )
  })

  it('serves markdown to crawlers', async () => {
    const { response } = await fetchMarkdown('javascript/select', {
      headers: { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
    })

    expectMarkdown(response)
  })

  it('keeps the bulk export and guide markdown URLs working', async () => {
    const [bulk, guide] = await Promise.all([
      fetch(`${DOCS_BASE_URL}/docs/markdown/reference/js.md`),
      fetch(`${DOCS_BASE_URL}/docs/guides/getting-started.md`),
    ])

    expect(bulk.status).toBe(200)
    expect(guide.status).toBe(200)
  })

  it('does not let a cache serve one representation of a URL for the other', async () => {
    const MARKDOWN = 'text/markdown, text/html;q=0.9'
    const HTML = 'text/html,application/xhtml+xml,*/*;q=0.8'
    const contentTypes: Array<string | null> = []
    for (const accept of [MARKDOWN, HTML, MARKDOWN]) {
      const response = await fetch(`${REFERENCE_URL}/javascript/select`, { headers: { accept } })
      contentTypes.push(response.headers.get('content-type'))
    }

    expect(contentTypes[0]).toContain('text/markdown')
    expect(contentTypes[1]).toContain('text/html')
    expect(contentTypes[2]).toContain('text/markdown')
  })
})

import { describe, expect, it } from 'vitest'

const GUIDES_URL = 'https://supabase.com/docs/guides/auth'

const BROWSER_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'

describe('prod smoke test: /guides/* markdown content negotiation', () => {
  it('serves HTML for a browser Accept header', async () => {
    const res = await fetch(GUIDES_URL, { headers: { Accept: BROWSER_ACCEPT } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('serves markdown for Accept: text/markdown', async () => {
    const res = await fetch(GUIDES_URL, { headers: { Accept: 'text/markdown' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/markdown')
  })

  it('prefers HTML when its q-value outranks markdown', async () => {
    const res = await fetch(GUIDES_URL, {
      headers: { Accept: 'text/html;q=1.0, text/markdown;q=0.5' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('returns 406 when Accept excludes every type the route serves', async () => {
    const res = await fetch(GUIDES_URL, {
      headers: { Accept: 'application/x-content-negotiation-probe' },
    })
    expect(res.status).toBe(406)
    expect(res.headers.get('cache-control')).toContain('no-store')
    expect(res.headers.get('vary')?.toLowerCase()).toContain('accept')
  })

  it('serves markdown to an LLM user agent regardless of Accept', async () => {
    const res = await fetch(GUIDES_URL, {
      headers: { 'User-Agent': 'Claude-User/1.0', Accept: BROWSER_ACCEPT },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/markdown')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc }) }))

const init = vi.fn()
const captureException = vi.fn()
const flush = vi.fn(async () => true)
vi.mock('@sentry/node', () => ({ init, captureException, flush }))

const { GET } = await import('./index.js')

const row = {
  page_title: 'Migrate from Heroku',
  slug: 'kb/guides/Migrate-From-Heroku',
  heading: 'Overview',
  excerpt: 'Move your database',
  score: 1,
}

const search = (params: string) => GET(new Request(`https://supabase.com/kb/api/search?${params}`))

describe('GET /api/search', () => {
  beforeEach(() => {
    rpc.mockReset()
    captureException.mockReset()
    flush.mockClear()
    vi.unstubAllGlobals()
  })

  it('rejects a missing or blank query', async () => {
    expect((await search('')).status).toBe(400)
    expect((await search('q=%20%20')).status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('maps rows to results and passes the limit through', async () => {
    rpc.mockResolvedValue({ data: [row], error: null })

    const response = await search('q=heroku&limit=3')

    expect(rpc).toHaveBeenCalledWith('search_kb', { query_text: 'heroku', match_limit: 3 })
    expect(await response.json()).toEqual([
      {
        title: 'Migrate from Heroku',
        href: 'https://supabase.com/kb/guides/Migrate-From-Heroku',
        heading: 'Overview',
        excerpt: 'Move your database',
        score: 1,
      },
    ])
  })

  it('defaults the limit to 10 when invalid', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    await search('q=x&limit=abc')
    expect(rpc).toHaveBeenCalledWith('search_kb', { query_text: 'x', match_limit: 10 })
  })

  it('returns 500 and reports to Sentry when the query fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })

    expect((await search('q=x')).status).toBe(500)
    expect(captureException).toHaveBeenCalledWith(
      new Error('boom'),
      expect.objectContaining({
        tags: { route: 'kb-search' },
        extra: expect.objectContaining({ query: 'x', limit: 10 }),
      })
    )
    expect(flush).toHaveBeenCalled()
  })

  it('returns 500 and reports to Sentry when the request throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const thrown = new Error('network down')
    rpc.mockRejectedValue(thrown)

    expect((await search('q=x')).status).toBe(500)
    expect(captureException).toHaveBeenCalledWith(
      thrown,
      expect.objectContaining({ tags: { route: 'kb-search' } })
    )
    expect(flush).toHaveBeenCalled()
  })

  it('does not report successful searches', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    await search('q=x')
    expect(captureException).not.toHaveBeenCalled()
  })

  it('includes markdown content, or null when it cannot be fetched', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    rpc.mockResolvedValue({ data: [row, { ...row, slug: 'kb/guides/missing' }], error: null })
    const fetch = vi.fn(async (url: string) =>
      url.endsWith('missing.md') ? new Response('', { status: 404 }) : new Response('# Heroku')
    )
    vi.stubGlobal('fetch', fetch)

    const results = await (await search('q=x&content=true')).json()

    expect(fetch).toHaveBeenCalledWith('https://supabase.com/kb/guides/Migrate-From-Heroku.md')
    expect(results.map((r: { content: string | null }) => r.content)).toEqual(['# Heroku', null])
  })
})

describe('Sentry setup', () => {
  beforeEach(() => {
    init.mockClear()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('skips Sentry under vercel dev', async () => {
    vi.stubEnv('VERCEL_ENV', 'development')
    await import('./index.js')
    expect(init).not.toHaveBeenCalled()
  })

  it('sets up Sentry on deployments, labeled with the Vercel environment', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    await import('./index.js')
    expect(init).toHaveBeenCalledWith(expect.objectContaining({ environment: 'preview' }))
  })
})

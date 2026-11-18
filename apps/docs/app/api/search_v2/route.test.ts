import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('~/scripts/search_v2/supabase', () => ({
  SEARCH_FUNCTION: 'docs_search_v2',
  createSupabaseClient: () => ({ rpc }),
}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('~/lib/constants', () => ({
  BASE_PATH: '/docs',
  IS_DEV: false,
  IS_PRODUCTION: true,
  PROD_URL: 'https://supabase.com/docs',
}))

const { GET } = await import('./route')

const guideRow = { slug: 'guides/auth/users', page_title: 'Users', heading: 'Users', score: 3500 }
const referenceRow = { slug: 'reference/javascript/auth-signup', page_title: 'signUp', score: 3400 }

const search = (params: string) =>
  GET(new Request(`https://supabase.com/docs/api/search_v2?${params}`) as never)

describe('GET /api/search_v2', () => {
  beforeEach(() => {
    rpc.mockReset()
    vi.unstubAllGlobals()
  })

  it('rejects a missing query', async () => {
    expect((await search('')).status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('returns the rows as is, without fetching content, by default', async () => {
    rpc.mockResolvedValue({ data: [guideRow], error: null })
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    const response = await search('q=users&limit=3')

    expect(rpc).toHaveBeenCalledWith('docs_search_v2', { query_text: 'users', match_limit: 3 })
    expect(await response.json()).toEqual([guideRow])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('adds the markdown of guides when content=true', async () => {
    rpc.mockResolvedValue({ data: [guideRow], error: null })
    const fetch = vi.fn(async () => new Response('# Users'))
    vi.stubGlobal('fetch', fetch)

    const results = await (await search('q=users&content=true')).json()

    expect(fetch).toHaveBeenCalledWith('https://supabase.com/docs/guides/auth/users.md')
    expect(results).toEqual([{ ...guideRow, content: '# Users' }])
  })

  it('sets content to null for pages with no markdown or that fail to load', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const missing = { ...guideRow, slug: 'guides/missing' }
    rpc.mockResolvedValue({ data: [referenceRow, missing], error: null })
    const fetch = vi.fn(async () => new Response('', { status: 404 }))
    vi.stubGlobal('fetch', fetch)

    const results = await (await search('q=x&content=true')).json()

    // reference pages have no markdown export, so they are not fetched at all
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(results.map((r: { content: string | null }) => r.content)).toEqual([null, null])
  })

  it('returns 500 when the query fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect((await search('q=x')).status).toBe(500)
  })
})

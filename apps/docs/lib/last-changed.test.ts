import { beforeEach, describe, expect, it, vi } from 'vitest'

const { range, captureException } = vi.hoisted(() => ({
  range: vi.fn(),
  captureException: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({ captureException }))
vi.mock('~/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        like: () => ({
          order: () => ({ range }),
        }),
      }),
    }),
  }),
}))

async function loadGetGuideLastUpdated() {
  const lastChanged = await import('./last-changed')
  return lastChanged.getGuideLastUpdated
}

describe('getGuideLastUpdated', () => {
  beforeEach(() => {
    vi.resetModules()
    range.mockReset()
    captureException.mockReset()
  })

  it('returns the newest last_updated across a page’s section rows', async () => {
    range.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          parent_page: '/content/guides/auth/jwts.mdx',
          last_updated: '2026-10-01T12:00:00+00:00',
        },
        {
          id: 2,
          parent_page: '/content/guides/auth/jwts.mdx',
          last_updated: '2026-10-05T08:00:00+00:00',
        },
        {
          id: 3,
          parent_page: '/content/guides/auth/jwts.mdx',
          last_updated: '2026-09-20T08:00:00+00:00',
        },
        {
          id: 4,
          parent_page: '/content/guides/auth.mdx',
          last_updated: '2026-08-01T00:00:00+00:00',
        },
      ],
      error: null,
    })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    expect(await getGuideLastUpdated(['auth', 'jwts'])).toBe('2026-10-05T08:00:00+00:00')
    expect(await getGuideLastUpdated(['auth'])).toBe('2026-08-01T00:00:00+00:00')
  })

  it('returns undefined for a page with no rows', async () => {
    range.mockResolvedValueOnce({ data: [], error: null })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    expect(await getGuideLastUpdated(['auth', 'missing'])).toBeUndefined()
  })

  it('reads every page of rows before building the map', async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      parent_page: `/content/guides/auth/page-${i}.mdx`,
      last_updated: '2026-10-01T00:00:00+00:00',
    }))
    range.mockResolvedValueOnce({ data: fullPage, error: null }).mockResolvedValueOnce({
      data: [
        {
          id: 1001,
          parent_page: '/content/guides/auth/last.mdx',
          last_updated: '2026-10-09T00:00:00+00:00',
        },
      ],
      error: null,
    })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    expect(await getGuideLastUpdated(['auth', 'last'])).toBe('2026-10-09T00:00:00+00:00')
    expect(range).toHaveBeenNthCalledWith(1, 0, 999)
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it('reads the table once and reuses the map for later lookups', async () => {
    range.mockResolvedValueOnce({ data: [], error: null })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    await getGuideLastUpdated(['auth'])
    await getGuideLastUpdated(['database', 'tables'])

    expect(range).toHaveBeenCalledTimes(1)
  })

  it('returns undefined and reports the error when the read fails', async () => {
    range.mockResolvedValueOnce({ data: null, error: new Error('boom') })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    expect(await getGuideLastUpdated(['auth'])).toBeUndefined()
    expect(captureException).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed read instead of caching the failure', async () => {
    range.mockResolvedValueOnce({ data: null, error: new Error('boom') }).mockResolvedValueOnce({
      data: [
        {
          id: 1,
          parent_page: '/content/guides/auth.mdx',
          last_updated: '2026-10-02T00:00:00+00:00',
        },
      ],
      error: null,
    })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    expect(await getGuideLastUpdated(['auth'])).toBeUndefined()
    expect(await getGuideLastUpdated(['auth'])).toBe('2026-10-02T00:00:00+00:00')
    expect(range).toHaveBeenCalledTimes(2)
  })
})

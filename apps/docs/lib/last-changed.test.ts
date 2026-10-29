import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { range, abortSignal, captureException } = vi.hoisted(() => {
  const range = vi.fn()
  return {
    range,
    abortSignal: vi.fn((_signal: AbortSignal) => ({ range })),
    captureException: vi.fn(),
  }
})

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({ captureException }))
vi.mock('~/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        like: () => ({
          order: () => ({ abortSignal }),
        }),
      }),
    }),
  }),
}))

const COOLDOWN_MS = 60_000

const row = (parent_page: string, last_updated: string) => ({ parent_page, last_updated })

async function loadGetGuideLastUpdated() {
  const lastChanged = await import('./last-changed')
  return lastChanged.getGuideLastUpdated
}

describe('getGuideLastUpdated', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers({ toFake: ['Date'] })
    range.mockReset()
    abortSignal.mockClear()
    captureException.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the newest last_updated across a page’s section rows', async () => {
    range.mockResolvedValueOnce({
      data: [
        row('/content/guides/auth/jwts.mdx', '2026-10-01T12:00:00+00:00'),
        row('/content/guides/auth/jwts.mdx', '2026-10-05T08:00:00+00:00'),
        row('/content/guides/auth/jwts.mdx', '2026-09-20T08:00:00+00:00'),
        row('/content/guides/auth.mdx', '2026-08-01T00:00:00+00:00'),
      ],
      error: null,
    })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    expect(await getGuideLastUpdated(['auth', 'jwts'])).toBe('2026-10-05T08:00:00+00:00')
    expect(await getGuideLastUpdated(['auth'])).toBe('2026-08-01T00:00:00+00:00')
    expect(await getGuideLastUpdated(['auth', 'missing'])).toBeUndefined()
  })

  it('reads every page of rows under one abort signal', async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) =>
      row(`/content/guides/auth/page-${i}.mdx`, '2026-10-01T00:00:00+00:00')
    )
    range.mockResolvedValueOnce({ data: fullPage, error: null }).mockResolvedValueOnce({
      data: [row('/content/guides/auth/last.mdx', '2026-10-09T00:00:00+00:00')],
      error: null,
    })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    expect(await getGuideLastUpdated(['auth', 'last'])).toBe('2026-10-09T00:00:00+00:00')
    expect(range).toHaveBeenNthCalledWith(1, 0, 999)
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999)

    const [first] = abortSignal.mock.calls[0]
    const [second] = abortSignal.mock.calls[1]
    expect(first).toBeInstanceOf(AbortSignal)
    expect(second).toBe(first)
  })

  it('reads the table once and reuses the map for later lookups', async () => {
    range.mockResolvedValueOnce({ data: [], error: null })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    await getGuideLastUpdated(['auth'])
    await getGuideLastUpdated(['database', 'tables'])

    expect(range).toHaveBeenCalledTimes(1)
  })

  it('returns undefined, reports the error, and skips lookups during the cooldown', async () => {
    range.mockResolvedValueOnce({ data: null, error: new Error('boom') })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    expect(await getGuideLastUpdated(['auth'])).toBeUndefined()
    expect(captureException).toHaveBeenCalledTimes(1)

    expect(await getGuideLastUpdated(['auth'])).toBeUndefined()
    expect(range).toHaveBeenCalledTimes(1)
  })

  it('retries once the cooldown after a failed read has passed', async () => {
    range.mockResolvedValueOnce({ data: null, error: new Error('boom') }).mockResolvedValueOnce({
      data: [row('/content/guides/auth.mdx', '2026-10-02T00:00:00+00:00')],
      error: null,
    })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    await getGuideLastUpdated(['auth'])
    vi.setSystemTime(Date.now() + COOLDOWN_MS + 1)

    expect(await getGuideLastUpdated(['auth'])).toBe('2026-10-02T00:00:00+00:00')
    expect(range).toHaveBeenCalledTimes(2)
  })
})

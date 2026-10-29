import { beforeEach, describe, expect, it, vi } from 'vitest'

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

async function loadGetGuideLastUpdated() {
  const lastChanged = await import('./last-changed')
  return lastChanged.getGuideLastUpdated
}

describe('getGuideLastUpdated', () => {
  beforeEach(() => {
    vi.resetModules()
    range.mockReset()
    abortSignal.mockClear()
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

  it('shares one abort signal across every page of the lookup', async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      parent_page: `/content/guides/auth/page-${i}.mdx`,
      last_updated: '2026-10-01T00:00:00+00:00',
    }))
    range.mockResolvedValueOnce({ data: fullPage, error: null }).mockResolvedValueOnce({
      data: [],
      error: null,
    })
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    await getGuideLastUpdated(['auth'])

    expect(abortSignal).toHaveBeenCalledTimes(2)
    const [first] = abortSignal.mock.calls[0]
    const [second] = abortSignal.mock.calls[1]
    expect(first).toBeInstanceOf(AbortSignal)
    expect(second).toBe(first)
  })

  it('skips new lookups during the cooldown after a timeout', async () => {
    const controller = new AbortController()
    vi.spyOn(AbortSignal, 'timeout').mockReturnValueOnce(controller.signal)
    range.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          controller.signal.addEventListener('abort', () =>
            resolve({ data: null, error: new Error('aborted') })
          )
        })
    )
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    const first = getGuideLastUpdated(['auth'])
    controller.abort()
    await first

    expect(await getGuideLastUpdated(['auth'])).toBeUndefined()
    expect(range).toHaveBeenCalledTimes(1)
  })

  it('starts a new lookup once the cooldown after a timeout has passed', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const controller = new AbortController()
      vi.spyOn(AbortSignal, 'timeout').mockReturnValueOnce(controller.signal)
      range.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            controller.signal.addEventListener('abort', () =>
              resolve({ data: null, error: new Error('aborted') })
            )
          })
      )
      range.mockResolvedValueOnce({ data: [], error: null })
      const getGuideLastUpdated = await loadGetGuideLastUpdated()

      const first = getGuideLastUpdated(['auth'])
      controller.abort()
      await first

      vi.setSystemTime(new Date(Date.now() + 60_001))
      await getGuideLastUpdated(['auth'])

      expect(range).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns undefined and reports the error when the lookup times out', async () => {
    const controller = new AbortController()
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValueOnce(controller.signal)
    range.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          controller.signal.addEventListener('abort', () =>
            resolve({ data: null, error: new Error('aborted') })
          )
        })
    )
    const getGuideLastUpdated = await loadGetGuideLastUpdated()

    const lookup = getGuideLastUpdated(['auth'])
    controller.abort()

    expect(await lookup).toBeUndefined()
    expect(captureException).toHaveBeenCalledTimes(1)
    timeoutSpy.mockRestore()
  })
})

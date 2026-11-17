import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlatformError, UnclassifiedApiError } from '@/lib/errors/studio-errors'

const captureException = vi.hoisted(() => vi.fn(() => 'event-123'))
vi.mock('@sentry/nextjs', () => ({ captureException }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost', IS_PLATFORM: false }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { handleError } = await import('./fetchers')
const { getQueryClient } = await import('./query-client')

// The production client, so its cache-level onError is what's under test. Retry settings are
// overridden per query to keep the tests fast.
const client = getQueryClient()

beforeEach(() => {
  captureException.mockClear()
  client.clear()
})

describe('reporting errors from React Query', () => {
  it('reports a query that fails through handleError once, after the last retry', async () => {
    const queryFn = vi.fn(async () => {
      handleError(
        { message: 'boom', code: 500 },
        { alwaysCapture: true, sentryContext: { tags: { feature: 'x' } } }
      )
    })

    await expect(
      client.fetchQuery({ queryKey: ['a'], queryFn, retry: 2, retryDelay: 0 })
    ).rejects.toMatchObject({ _tag: 'PlatformError' })

    expect(queryFn).toHaveBeenCalledTimes(3)
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ _tag: 'PlatformError' }),
      expect.objectContaining({
        tags: expect.objectContaining({ feature: 'x', error_tag: 'PlatformError', sample_rate: 1 }),
      })
    )
  })

  it('reports a failed mutation once', async () => {
    const mutation = client.getMutationCache().build(client, {
      mutationFn: async () => {
        handleError({ message: 'boom', code: 500 }, { alwaysCapture: true })
      },
    })

    await expect(mutation.execute(undefined)).rejects.toMatchObject({ _tag: 'PlatformError' })
    expect(captureException).toHaveBeenCalledTimes(1)
  })

  it('classifies and reports an error a query function throws itself', async () => {
    await expect(
      client.fetchQuery({
        queryKey: ['b'],
        retry: false,
        queryFn: async () => {
          throw new TypeError("Cannot read properties of undefined (reading 'x')")
        },
      })
    ).rejects.toBeDefined()

    expect(captureException).toHaveBeenCalledTimes(1)
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ _tag: 'UnexpectedError' }),
      expect.anything()
    )
  })
})

describe('retry policy', () => {
  const retry = client.getDefaultOptions().queries!.retry as (
    failureCount: number,
    error: unknown
  ) => boolean

  it.each([
    '/platform/projects/{ref}/run-lints',
    '/platform/organizations/{slug}/usage',
    '/platform/pg-meta/{ref}/query',
    '/v1/projects/{ref}/analytics/endpoints/logs.all',
  ])('does not retry a server error from %s', (endpoint) => {
    expect(retry(0, new PlatformError({ code: 500, endpoint }))).toBe(false)
  })

  it('still retries a rate limit from a skip-listed endpoint', () => {
    const error = new UnclassifiedApiError({
      code: 429,
      endpoint: '/platform/pg-meta/{ref}/query',
    })
    expect(retry(0, error)).toBe(true)
  })

  it('retries a server error from another endpoint', () => {
    expect(retry(0, new PlatformError({ code: 500, endpoint: '/platform/projects/{ref}' }))).toBe(
      true
    )
  })

  it('does not match concrete paths', () => {
    expect(
      retry(0, new PlatformError({ code: 500, endpoint: '/platform/pg-meta/abc/query' }))
    ).toBe(true)
  })
})

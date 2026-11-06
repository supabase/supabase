import { beforeEach, describe, expect, it, vi } from 'vitest'

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

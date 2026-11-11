import { beforeEach, describe, expect, it, vi } from 'vitest'

const { clock, recordRequest } = vi.hoisted(() => ({
  clock: { time: 0 },
  recordRequest: vi.fn(),
}))

vi.mock('@/lib/telemetry/request-timing/request-timing-collector', () => ({
  requestTimingCollector: { now: () => clock.time, recordRequest },
}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost', IS_PLATFORM: false }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { get, fetchHandler } = await import('./fetchers')

// The paths are typed against the generated schema; these tests only care about the URL pattern.
const call = get as unknown as (path: string, init: Record<string, unknown>) => Promise<any>

function mockFetch(impl: () => Promise<Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(impl as typeof fetch)
}

const respondAfter = (ms: number, status: number) => async () => {
  clock.time += ms
  return new Response('{}', { status, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  vi.restoreAllMocks()
  recordRequest.mockClear()
  clock.time = 0
})

describe('request timing in the fetch layer', () => {
  it('records a request under its method and path template, with the time to response', async () => {
    mockFetch(respondAfter(80, 200))

    await call('/platform/projects/{ref}', { params: { path: { ref: 'abcdefghijklmnopqrst' } } })

    expect(recordRequest).toHaveBeenCalledTimes(1)
    expect(recordRequest).toHaveBeenCalledWith({
      endpoint: 'GET /platform/projects/{ref}',
      startMs: 0,
      endMs: 80,
      isError: false,
    })
  })

  it('records an HTTP error response as an error', async () => {
    mockFetch(respondAfter(30, 500))

    await call('/platform/projects/{ref}', { params: { path: { ref: 'abc' } } })

    expect(recordRequest).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'GET /platform/projects/{ref}', isError: true })
    )
  })

  it('records a network failure as an error and still rejects with the classified error', async () => {
    mockFetch(async () => {
      clock.time += 15
      throw new TypeError('Failed to fetch')
    })

    await expect(
      call('/platform/projects/{ref}', { params: { path: { ref: 'abc' } } })
    ).rejects.toMatchObject({ _tag: 'NetworkUnreachable' })

    expect(recordRequest).toHaveBeenCalledWith({
      endpoint: 'GET /platform/projects/{ref}',
      startMs: 0,
      endMs: 15,
      isError: true,
    })
  })

  it('does not count a request that was cancelled on purpose as a failure', async () => {
    mockFetch(async () => {
      throw new DOMException('The operation was aborted', 'AbortError')
    })

    await call('/platform/projects/{ref}', { params: { path: { ref: 'abc' } } }).catch(() => {})

    expect(recordRequest).toHaveBeenCalledWith(expect.objectContaining({ isError: false }))
  })

  it('never records the URL of a request made without the openapi client', async () => {
    mockFetch(respondAfter(5, 200))

    await fetchHandler('https://api.example.com/projects/abcdefghijklmnopqrst?token=secret', {
      method: 'post',
    })

    expect(recordRequest).toHaveBeenCalledTimes(1)
    expect(recordRequest).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'POST unlabeled' })
    )
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const clock = vi.hoisted(() => ({ time: 1000 }))

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost', IS_PLATFORM: false }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// The collector decides once, when it is created, whether this page load records: it needs a
// browser on the platform and to win the sampling draw. Set that up before it is imported.
vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'true')
vi.stubGlobal('window', { addEventListener: vi.fn() })
vi.spyOn(Math, 'random').mockReturnValue(0)
vi.spyOn(performance, 'now').mockImplementation(() => clock.time)

// Import after the environment is set up
const { get, fetchHandler } = await import('./fetchers')
const { requestTimingCollector } =
  await import('@/lib/telemetry/request-timing/request-timing-collector')

// The paths are typed against the generated schema; these tests only care about the URL pattern.
const call = get as unknown as (path: string, init: Record<string, unknown>) => Promise<unknown>

function mockFetch(impl: () => Promise<Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(impl as typeof fetch)
}

const respondAfter = (ms: number, status: number) => async () => {
  clock.time += ms
  return new Response('{}', { status, headers: { 'Content-Type': 'application/json' } })
}

// What the collector would report for the requests made since the last call
const summarize = () => requestTimingCollector.finishVisit()!

beforeEach(() => {
  summarize()
})

describe('request timing in the fetch layer', () => {
  it('records a request under its method and path template, with the time to response', async () => {
    mockFetch(respondAfter(80, 200))

    await call('/platform/projects/{ref}', { params: { path: { ref: 'abcdefghijklmnopqrst' } } })

    expect(summarize()).toMatchObject({
      requestCount: 1,
      requestErrorCount: 0,
      requestSumMs: 80,
      endpoints: [
        {
          endpoint: 'GET /platform/projects/{ref}',
          count: 1,
          errorCount: 0,
          totalMs: 80,
          maxMs: 80,
        },
      ],
    })
  })

  it('records an HTTP error response as an error', async () => {
    mockFetch(respondAfter(30, 500))

    await call('/platform/projects/{ref}', { params: { path: { ref: 'abc' } } })

    expect(summarize()).toMatchObject({
      requestErrorCount: 1,
      endpoints: [{ endpoint: 'GET /platform/projects/{ref}', errorCount: 1 }],
    })
  })

  it('records a network failure as an error and still rejects with the classified error', async () => {
    mockFetch(async () => {
      clock.time += 15
      throw new TypeError('Failed to fetch')
    })

    await expect(
      call('/platform/projects/{ref}', { params: { path: { ref: 'abc' } } })
    ).rejects.toMatchObject({ _tag: 'NetworkUnreachable' })

    expect(summarize()).toMatchObject({
      requestErrorCount: 1,
      requestSumMs: 15,
      endpoints: [{ endpoint: 'GET /platform/projects/{ref}', errorCount: 1 }],
    })
  })

  it('does not count a request that was cancelled on purpose as a failure', async () => {
    mockFetch(async () => {
      throw new DOMException('The operation was aborted', 'AbortError')
    })

    await call('/platform/projects/{ref}', { params: { path: { ref: 'abc' } } }).catch(() => {})

    expect(summarize()).toMatchObject({ requestCount: 1, requestErrorCount: 0 })
  })

  it('never records the URL of a request made without the openapi client', async () => {
    mockFetch(respondAfter(5, 200))

    await fetchHandler('https://api.example.com/projects/abcdefghijklmnopqrst?token=secret', {
      method: 'post',
    })

    const summary = summarize()
    expect(summary.requestCount).toBe(1)
    expect(summary.endpoints.map((endpoint) => endpoint.endpoint)).toEqual(['POST unlabeled'])
  })
})

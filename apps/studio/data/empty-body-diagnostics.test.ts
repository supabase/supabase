// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const platform = vi.hoisted(() => ({ isPlatform: true }))
const sentry = vi.hoisted(() => ({ captureMessage: vi.fn(), captureException: vi.fn() }))

vi.mock('@sentry/nextjs', () => sentry)
vi.mock('common', () => ({
  get IS_PLATFORM() {
    return platform.isPlatform
  },
  getAccessToken: vi.fn(),
}))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
const uuid = vi.hoisted(() => ({ count: 0 }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => `uuid-${++uuid.count}` }))

// Import after mocks are set up
const { emptyBodyErrorContext, refetchWithoutCache } = await import('./empty-body-diagnostics')
const { client } = await import('./fetchers')

const SECRET = 'service_role_secret_value'

function emptyGet(path: string, init?: RequestInit) {
  const request = new Request(`http://localhost${path}?include=secret`, {
    headers: { 'X-Request-Id': 'original-uuid', Authorization: 'Bearer token' },
    ...init,
  })
  const response = new Response(null, {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private' },
  })
  return { request, response }
}

describe('refetchWithoutCache', () => {
  beforeEach(() => {
    uuid.count = 0
  })
  afterEach(() => vi.unstubAllGlobals())

  it('refetches with cache: no-store and a fresh X-Request-Id', async () => {
    const fetchMock = vi.fn<(request: Request) => Promise<Response>>(
      async () => new Response(JSON.stringify({ secret: SECRET }))
    )
    vi.stubGlobal('fetch', fetchMock)
    const { request } = emptyGet('/platform/projects/abcdefghijklmnopqrst/a')

    const { summary, response, body } = await refetchWithoutCache(request)

    const refetched = fetchMock.mock.lastCall?.[0]
    expect(refetched).toBeInstanceOf(Request)
    expect(refetched?.cache).toBe('no-store')
    expect(refetched?.method).toBe('GET')
    expect(refetched?.url).toBe(request.url)
    expect(refetched?.headers.get('Authorization')).toBe('Bearer token')
    expect(refetched?.headers.get('X-Request-Id')).toBe('uuid-1')
    // The original request is left untouched
    expect(request.headers.get('X-Request-Id')).toBe('original-uuid')
    expect(response?.status).toBe(200)
    expect(body).toBe(JSON.stringify({ secret: SECRET }))
    expect(summary).toEqual({
      requestId: 'uuid-1',
      status: 200,
      bodyLength: JSON.stringify({ secret: SECRET }).length,
      contentLength: null,
      contentType: 'text/plain;charset=UTF-8',
    })
  })

  it('returns the error name instead of throwing when the fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Load failed')))
    )
    const { request } = emptyGet('/platform/a')

    const result = await refetchWithoutCache(request)

    expect(result).toEqual({ summary: { requestId: 'uuid-1', error: 'TypeError' } })
  })

  it('gives up with an AbortError when the refetch stalls', async () => {
    vi.useFakeTimers()
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (request: Request) =>
            new Promise<Response>((_, reject) => {
              request.signal.addEventListener('abort', () =>
                reject(new DOMException('Aborted', 'AbortError'))
              )
            })
        )
      )
      const { request } = emptyGet('/platform/a')

      const pending = refetchWithoutCache(request)
      await vi.advanceTimersByTimeAsync(10_000)

      expect(await pending).toEqual({ summary: { requestId: 'uuid-1', error: 'AbortError' } })
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('emptyBodyErrorContext', () => {
  it('carries the refetch outcome with only lengths, never the body', () => {
    const { request, response } = emptyGet('/platform/projects/abcdefghijklmnopqrst/a')

    const context = emptyBodyErrorContext({
      request,
      response,
      refetch: {
        requestId: 'probe-uuid',
        status: 200,
        bodyLength: 0,
        contentLength: '0',
        contentType: 'application/json',
      },
    })

    expect(context).toMatchObject({
      tags: { recovered_by: 'none', probe_has_body: 'false', empty_body_diagnostic: 'true' },
      extra: {
        method: 'GET',
        status: 200,
        request_id: 'original-uuid',
        probe_request_id: 'probe-uuid',
        header_content_type: 'application/json',
        header_cache_control: 'private',
        header_etag: null,
        probe_status: 200,
        probe_body_length: 0,
        probe_content_length: '0',
        probe_content_type: 'application/json',
      },
    })
    expect(JSON.stringify(context)).not.toContain('Bearer token')
  })

  it('tags probe_has_body "error" when the refetch failed', () => {
    const { request, response } = emptyGet('/platform/c')

    const context = emptyBodyErrorContext({
      request,
      response,
      refetch: { requestId: 'probe-uuid', error: 'TypeError' },
    })

    expect(context).toMatchObject({
      tags: { recovered_by: 'none', probe_has_body: 'error' },
      extra: { probe_error: 'TypeError' },
    })
  })
})

// Untyped aliases for paths that are not in the generated schema
const get = client.GET as unknown as (
  path: string,
  init?: Record<string, unknown>
) => Promise<{ data?: unknown; error?: unknown }>
const post = client.POST as unknown as typeof get

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function emptyJson(init?: ResponseInit) {
  return new Response(null, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('openapi-fetch client — empty GET 200', () => {
  beforeEach(() => {
    platform.isPlatform = true
    sentry.captureMessage.mockReset()
    sentry.captureException.mockReset()
    uuid.count = 0
  })
  afterEach(() => vi.unstubAllGlobals())

  it('recovers the data by refetching with cache: no-store', async () => {
    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockImplementationOnce(async () => emptyJson())
      .mockImplementationOnce(async () => jsonResponse({ secret: SECRET }))
    vi.stubGlobal('fetch', fetchMock)

    const { data, error } = await client.GET('/platform/projects/{ref}/settings', {
      params: { path: { ref: 'abcdefghijklmnopqrst' } },
    })

    expect(error).toBeUndefined()
    expect(data).toEqual({ secret: SECRET })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [first, second] = fetchMock.mock.calls.map(([request]) => request)
    expect(first.cache).not.toBe('no-store')
    expect(second.cache).toBe('no-store')
    expect(second.method).toBe('GET')
    expect(second.url).toBe(first.url)
    expect(second.headers.get('X-Request-Id')).not.toBe(first.headers.get('X-Request-Id'))

    // A recovered empty body isn't reported
    expect(sentry.captureMessage).not.toHaveBeenCalled()
    expect(sentry.captureException).not.toHaveBeenCalled()
  })

  it('recovers when the empty response omits Content-Length too (no header at all)', async () => {
    // Response(null) never carries Content-Length in this environment
    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockImplementationOnce(async () => emptyJson())
      .mockImplementationOnce(async () => jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const { data } = await get('/platform/profile', {})

    expect(data).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('recovers when the empty response carries Content-Length: 0', async () => {
    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockImplementationOnce(async () =>
        emptyJson({ headers: { 'Content-Type': 'application/json', 'Content-Length': '0' } })
      )
      .mockImplementationOnce(async () => jsonResponse([{ slug: 'my-org' }]))
    vi.stubGlobal('fetch', fetchMock)

    const { data } = await client.GET('/platform/organizations/{slug}/members', {
      params: { path: { slug: 'my-org' } },
    })

    expect(data).toEqual([{ slug: 'my-org' }])
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('throws MalformedResponse when the refetch is also empty', async () => {
    const fetchMock = vi.fn(async () => emptyJson())
    vi.stubGlobal('fetch', fetchMock)

    const err = await get('/platform/client-a', {}).catch((e) => e)

    expect(err._tag).toBe('MalformedResponse')
    expect(err.endpoint).toBe('/platform/client-a')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('throws MalformedResponse when the refetch rejects', async () => {
    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockImplementationOnce(async () => emptyJson())
      .mockImplementationOnce(async () => Promise.reject(new TypeError('Load failed')))
    vi.stubGlobal('fetch', fetchMock)

    const err = await get('/platform/client-b', {}).catch((e) => e)

    expect(err._tag).toBe('MalformedResponse')
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('throws MalformedResponse when the refetch is not ok', async () => {
    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockImplementationOnce(async () => emptyJson())
      .mockImplementationOnce(async () =>
        jsonResponse({ message: 'Unauthorized' }, { status: 401 })
      )
    vi.stubGlobal('fetch', fetchMock)

    const err = await get('/platform/client-c', {}).catch((e) => e)

    expect(err._tag).toBe('MalformedResponse')
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('does not refetch an empty non-JSON response', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          status: 200,
          headers: { 'Content-Type': 'text/html', 'Content-Length': '0' },
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    await get('/platform/d', { parseAs: 'text' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('does not refetch an empty POST', async () => {
    const fetchMock = vi.fn(async () => emptyJson({ status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    const { data } = await post('/platform/e', { body: {} })

    expect(data).toEqual({})
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('does not retry a request that was already aborted', async () => {
    const controller = new AbortController()
    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockImplementationOnce(async () => {
        controller.abort()
        return emptyJson()
      })
      .mockImplementation(async (request) => {
        if (request.signal.aborted) throw new DOMException('Aborted', 'AbortError')
        return jsonResponse({ ok: true })
      })
    vi.stubGlobal('fetch', fetchMock)

    const err = await get('/platform/f', { signal: controller.signal }).catch((e) => e)

    expect(err._tag).toBe('RequestAborted')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })
})

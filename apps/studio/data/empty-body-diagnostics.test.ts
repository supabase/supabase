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
const { refetchWithoutCache, reportEmptyBodyResponse, templateEndpointPath } =
  await import('./empty-body-diagnostics')
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

function lastCapture() {
  const [message, context] = sentry.captureMessage.mock.lastCall ?? []
  return { message, context }
}

describe('templateEndpointPath', () => {
  it.each([
    ['/platform/projects/abcdefghijklmnopqrst/settings', '/platform/projects/{ref}/settings'],
    ['/platform/organizations/my-org/members', '/platform/organizations/{slug}/members'],
    [
      '/v1/projects/abcdefghijklmnopqrst/branches/dev/config',
      '/v1/projects/{ref}/branches/{branch}/config',
    ],
    ['/platform/pg-meta/abcdefghijklmnopqrst/tables', '/platform/pg-meta/{id}/tables'],
    [
      '/platform/organizations/{slug}/members/3f2b8c1e-9d4a-4e6b-8c7d-1a2b3c4d5e6f',
      '/platform/organizations/{slug}/members/{id}',
    ],
    ['/platform/projects/{ref}/backups/12345', '/platform/projects/{ref}/backups/{id}'],
    ['/platform/projects/{ref}/api-keys?reveal=true', '/platform/projects/{ref}/api-keys'],
    ['/platform/profile#section', '/platform/profile'],
    ['/platform/projects/{ref}/custom-hostname', '/platform/projects/{ref}/custom-hostname'],
    ['/platform/projects', '/platform/projects'],
    ['/platform/constructor/toString', '/platform/constructor/toString'],
    ['', ''],
  ])('templates %s as %s', (path, expected) => {
    expect(templateEndpointPath(path)).toBe(expected)
  })
})

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
})

describe('reportEmptyBodyResponse', () => {
  beforeEach(() => {
    platform.isPlatform = true
    sentry.captureMessage.mockReset()
    uuid.count = 0
  })
  afterEach(() => vi.unstubAllGlobals())

  it('reports the refetch outcome with only lengths, never the body', async () => {
    const { request, response } = emptyGet('/platform/projects/abcdefghijklmnopqrst/a')

    await reportEmptyBodyResponse({
      request,
      response,
      schemaPath: '/platform/projects/{ref}/a',
      recoveredBy: 'refetch',
      refetch: {
        requestId: 'probe-uuid',
        status: 200,
        bodyLength: JSON.stringify({ secret: SECRET }).length,
        contentLength: '30',
        contentType: 'application/json',
      },
    })

    const { message, context } = lastCapture()
    expect(message).toBe('Empty response body on successful API request')
    expect(context).toMatchObject({
      level: 'warning',
      fingerprint: ['empty-body-response', '/platform/projects/{ref}/a'],
      tags: {
        endpoint: '/platform/projects/{ref}/a',
        recovered_by: 'refetch',
        probe_has_body: 'true',
        empty_body_diagnostic: 'true',
      },
      extra: {
        method: 'GET',
        status: 200,
        request_id: 'original-uuid',
        probe_request_id: 'probe-uuid',
        header_content_type: 'application/json',
        header_cache_control: 'private',
        header_etag: null,
        probe_status: 200,
        probe_body_length: JSON.stringify({ secret: SECRET }).length,
        probe_content_length: '30',
        probe_content_type: 'application/json',
      },
    })
    expect(JSON.stringify(sentry.captureMessage.mock.calls)).not.toContain(SECRET)
  })

  it('reports probe_has_body "false" when the refetch was also empty', async () => {
    const { request, response } = emptyGet('/platform/b')

    await reportEmptyBodyResponse({
      request,
      response,
      schemaPath: '/platform/b',
      recoveredBy: 'none',
      refetch: { requestId: 'probe-uuid', status: 200, bodyLength: 0 },
    })

    expect(lastCapture().context).toMatchObject({
      tags: { recovered_by: 'none', probe_has_body: 'false' },
      extra: { probe_body_length: 0 },
    })
  })

  it('reports probe_has_body "error" when the refetch failed', async () => {
    const { request, response } = emptyGet('/platform/c')

    await reportEmptyBodyResponse({
      request,
      response,
      schemaPath: '/platform/c',
      recoveredBy: 'none',
      refetch: { requestId: 'probe-uuid', error: 'TypeError' },
    })

    expect(lastCapture().context).toMatchObject({
      tags: { recovered_by: 'none', probe_has_body: 'error' },
      extra: { probe_error: 'TypeError' },
    })
  })

  it('omits probe tags when no refetch happened', async () => {
    const { request, response } = emptyGet('/platform/h')

    await reportEmptyBodyResponse({
      request,
      response,
      schemaPath: '/platform/h',
      recoveredBy: 'original_body',
    })

    const { tags } = lastCapture().context
    expect(tags).toMatchObject({ recovered_by: 'original_body' })
    expect(tags).not.toHaveProperty('probe_has_body')
  })

  it('does not issue any request of its own', async () => {
    const fetchMock = vi.fn(async () => new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    const { request, response } = emptyGet('/platform/i')

    await reportEmptyBodyResponse({
      request,
      response,
      schemaPath: '/platform/i',
      recoveredBy: 'none',
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(sentry.captureMessage).toHaveBeenCalledTimes(1)
  })

  it('reports at most once per endpoint', async () => {
    for (const ref of ['abcdefghijklmnopqrst', 'tsrqponmlkjihgfedcba']) {
      const { request, response } = emptyGet(`/platform/projects/${ref}/d`)
      await reportEmptyBodyResponse({
        request,
        response,
        schemaPath: '/platform/projects/{ref}/d',
        recoveredBy: 'none',
      })
    }

    expect(sentry.captureMessage).toHaveBeenCalledTimes(1)
  })

  it('skips non-GET requests', async () => {
    const { request, response } = emptyGet('/platform/e', { method: 'POST' })

    await reportEmptyBodyResponse({
      request,
      response,
      schemaPath: '/platform/e',
      recoveredBy: 'none',
    })

    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('skips when not on platform', async () => {
    platform.isPlatform = false
    const { request, response } = emptyGet('/platform/f')

    await reportEmptyBodyResponse({
      request,
      response,
      schemaPath: '/platform/f',
      recoveredBy: 'none',
    })

    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('does not throw when Sentry throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    sentry.captureMessage.mockImplementation(() => {
      throw new Error('sentry down')
    })
    const { request, response } = emptyGet('/platform/g')

    await expect(
      reportEmptyBodyResponse({
        request,
        response,
        schemaPath: '/platform/g',
        recoveredBy: 'none',
      })
    ).resolves.toBeUndefined()
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

    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    expect(lastCapture().context).toMatchObject({
      tags: {
        endpoint: '/platform/projects/{ref}/settings',
        recovered_by: 'refetch',
        probe_has_body: 'true',
      },
      extra: { probe_request_id: second.headers.get('X-Request-Id'), probe_status: 200 },
    })
    expect(JSON.stringify(sentry.captureMessage.mock.calls)).not.toContain(SECRET)
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
    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    expect(lastCapture().context).toMatchObject({
      tags: { endpoint: '/platform/organizations/{slug}/members', recovered_by: 'refetch' },
      extra: { header_content_length: '0' },
    })
  })

  it('falls back to {} when the refetch is also empty', async () => {
    const fetchMock = vi.fn(async () => emptyJson())
    vi.stubGlobal('fetch', fetchMock)

    const { data, error } = await get('/platform/client-a', {})

    expect(error).toBeUndefined()
    expect(data).toEqual({})
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    expect(lastCapture().context).toMatchObject({
      tags: { endpoint: '/platform/client-a', recovered_by: 'none', probe_has_body: 'false' },
      extra: { probe_body_length: 0 },
    })
  })

  it('falls back to {} without throwing when the refetch rejects', async () => {
    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockImplementationOnce(async () => emptyJson())
      .mockImplementationOnce(async () => Promise.reject(new TypeError('Load failed')))
    vi.stubGlobal('fetch', fetchMock)

    const { data, error } = await get('/platform/client-b', {})

    expect(error).toBeUndefined()
    expect(data).toEqual({})
    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    expect(lastCapture().context).toMatchObject({
      tags: { recovered_by: 'none', probe_has_body: 'error' },
      extra: { probe_error: 'TypeError' },
    })
  })

  it('falls back to {} when the refetch is not ok', async () => {
    const fetchMock = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockImplementationOnce(async () => emptyJson())
      .mockImplementationOnce(async () =>
        jsonResponse({ message: 'Unauthorized' }, { status: 401 })
      )
    vi.stubGlobal('fetch', fetchMock)

    const { data, error } = await get('/platform/client-c', {})

    expect(error).toBeUndefined()
    expect(data).toEqual({})
    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    expect(lastCapture().context).toMatchObject({
      tags: { recovered_by: 'none', probe_has_body: 'true' },
      extra: { probe_status: 401 },
    })
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
    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    const { tags } = lastCapture().context
    expect(tags).toMatchObject({ recovered_by: 'none' })
    expect(tags).not.toHaveProperty('probe_has_body')
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

    const { data } = await get('/platform/f', { signal: controller.signal })

    expect(data).toEqual({})
    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    expect(lastCapture().context).toMatchObject({
      tags: { recovered_by: 'none', probe_has_body: 'error' },
      extra: { probe_error: 'AbortError' },
    })
  })
})

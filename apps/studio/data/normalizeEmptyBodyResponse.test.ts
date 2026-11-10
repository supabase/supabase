import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

const source = (method = 'GET') => ({
  request: new Request('http://localhost/platform/profile', {
    method,
    headers: { 'X-Request-Id': 'original-uuid' },
  }),
  schemaPath: '/platform/profile',
})

// Import after mocks are set up
const { normalizeEmptyBodyResponse, client } = await import('./fetchers')

describe('normalizeEmptyBodyResponse', () => {
  it('adds Content-Length: 0 to an empty 201 that omits it (HTTP/3 case)', async () => {
    // HTTP/3 responses can drop `Content-Length: 0` on empty bodies, which makes
    // openapi-fetch attempt to JSON-parse the empty body and throw.
    const response = new Response(null, {
      status: 201,
      statusText: 'Created',
      headers: { 'X-Request-Id': 'req-123' },
    })
    expect(response.headers.has('Content-Length')).toBe(false)

    const normalized = await normalizeEmptyBodyResponse(response)

    expect(normalized.status).toBe(201)
    expect(normalized.statusText).toBe('Created')
    expect(normalized.headers.get('X-Request-Id')).toBe('req-123')
    expect(normalized.headers.get('Content-Length')).toBe('0')
    // The normalized empty body must not throw when parsed the way openapi-fetch parses it.
    expect(await normalized.text()).toBe('')
  })

  it('leaves a response that already has Content-Length untouched (HTTP/2 case)', async () => {
    const response = new Response(null, {
      status: 201,
      headers: { 'Content-Length': '0' },
    })

    const normalized = await normalizeEmptyBodyResponse(response)

    expect(normalized).toBe(response)
  })

  it('does not modify a non-empty body that omits Content-Length', async () => {
    const response = new Response(JSON.stringify({ id: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.headers.has('Content-Length')).toBe(false)

    const normalized = await normalizeEmptyBodyResponse(response)

    // Returns the original response (body still readable, not consumed by the peek).
    expect(normalized).toBe(response)
    expect(await normalized.json()).toEqual({ id: 1 })
  })

  it('leaves 204 No Content untouched even without Content-Length', async () => {
    const response = new Response(null, { status: 204 })

    const normalized = await normalizeEmptyBodyResponse(response)

    expect(normalized).toBe(response)
  })
})

describe('normalizeEmptyBodyResponse — recovery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('refetches an empty JSON GET with cache: no-store and returns the retried body', async () => {
    const fetchMock = vi.fn<(request: Request) => Promise<Response>>(
      async () =>
        new Response(JSON.stringify({ id: 1 }), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json', 'X-Retried': 'yes' },
        })
    )
    vi.stubGlobal('fetch', fetchMock)
    const empty = new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    const { request, schemaPath } = source()

    const normalized = await normalizeEmptyBodyResponse(empty, { request, schemaPath })

    const retried = fetchMock.mock.lastCall?.[0]
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(retried?.cache).toBe('no-store')
    expect(retried?.headers.get('X-Request-Id')).toBe('test-uuid')
    expect(normalized.headers.get('X-Retried')).toBe('yes')
    expect(await normalized.json()).toEqual({ id: 1 })
  })

  it.each([
    ['rejects', async () => Promise.reject(new TypeError('Load failed'))],
    ['is not ok', async () => new Response('{"message":"nope"}', { status: 401 })],
    ['is empty', async () => new Response(null, { status: 200 })],
  ])('falls back to an empty Content-Length: 0 response when the refetch %s', async (_, impl) => {
    vi.stubGlobal('fetch', vi.fn(impl))
    const empty = new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const normalized = await normalizeEmptyBodyResponse(empty, source())

    expect(normalized.status).toBe(200)
    expect(normalized.headers.get('Content-Length')).toBe('0')
    expect(await normalized.text()).toBe('')
  })

  it('does not refetch an empty non-JSON GET', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const empty = new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'text/html', 'Content-Length': '0' },
    })

    const normalized = await normalizeEmptyBodyResponse(empty, source())

    expect(normalized).toBe(empty)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not refetch an empty non-GET request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const empty = new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const normalized = await normalizeEmptyBodyResponse(empty, source('POST'))

    expect(normalized.headers.get('Content-Length')).toBe('0')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not refetch without a source request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const empty = new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    await normalizeEmptyBodyResponse(empty)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the original body when only the clone came back empty', async () => {
    // jsdom can't reproduce a broken tee, so the clone is stubbed to return an empty body
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = new Response(JSON.stringify({ id: 2 }), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-1' },
    })
    response.clone = () => new Response(null)

    const normalized = await normalizeEmptyBodyResponse(response, source())

    expect(fetchMock).not.toHaveBeenCalled()
    expect(normalized.status).toBe(200)
    expect(normalized.statusText).toBe('OK')
    expect(normalized.headers.get('X-Request-Id')).toBe('req-1')
    expect(await normalized.json()).toEqual({ id: 2 })
  })
})

describe('openapi-fetch client — empty 201 without Content-Length (HTTP/3)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('resolves with data instead of throwing on JSON parse', async () => {
    // Simulate the HTTP/3 transport: a 201 with an empty body and no Content-Length.
    // Without normalization openapi-fetch calls response.json() and throws
    // "Unexpected end of JSON input"; the middleware should make this succeed.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 201 }))
    )

    const { data, error, response } = await client.POST('/v1/projects/{ref}/secrets' as any, {
      params: { path: { ref: 'test-ref' } },
      body: [] as any,
    })

    expect(error).toBeUndefined()
    expect(data).toEqual({})
    expect(response.status).toBe(201)
  })
})

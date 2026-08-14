import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { normalizeEmptyBodyResponse, client } = await import('./fetchers')

describe('normalizeEmptyBodyResponse', () => {
  it('adds Content-Length: 0 to an empty 201 that omits it (HTTP/3 case)', async () => {
    // HTTP/3 responses can drop `Content-Length: 0` on empty bodies, which makes
    // openapi-fetch attempt to JSON-parse the empty body and throw.
    const response = new Response(null, { status: 201 })
    expect(response.headers.has('Content-Length')).toBe(false)

    const normalized = await normalizeEmptyBodyResponse(response)

    expect(normalized.status).toBe(201)
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

  it('preserves status and statusText when normalizing', async () => {
    const response = new Response(null, { status: 201, statusText: 'Created' })

    const normalized = await normalizeEmptyBodyResponse(response)

    expect(normalized.status).toBe(201)
    expect(normalized.statusText).toBe('Created')
  })

  it('preserves other headers when adding Content-Length', async () => {
    const response = new Response(null, {
      status: 201,
      headers: { 'X-Request-Id': 'req-123' },
    })

    const normalized = await normalizeEmptyBodyResponse(response)

    expect(normalized.headers.get('X-Request-Id')).toBe('req-123')
    expect(normalized.headers.get('Content-Length')).toBe('0')
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

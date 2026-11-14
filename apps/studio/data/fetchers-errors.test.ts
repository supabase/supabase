import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost', IS_PLATFORM: false }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { get, handleError, fetchGet, fetchPost } = await import('./fetchers')
const { NETWORK_UNREACHABLE_MESSAGE } = await import('./error-classification')

// The paths are typed against the generated schema; these tests only care about the URL pattern.
const call = get as unknown as (path: string, init: Record<string, unknown>) => Promise<any>

function mockFetch(impl: () => Promise<Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(impl as typeof fetch)
}

async function catchError(promise: Promise<unknown>) {
  try {
    await promise
  } catch (e) {
    return e as any
  }
  throw new Error('expected a rejection')
}

async function failWith(response: Response, path = '/platform/projects/{ref}') {
  mockFetch(async () => response)
  const result = await call(path, { params: { path: { ref: 'abc' } } })
  return catchError(Promise.resolve().then(() => handleError(result.error)))
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('client transport failures', () => {
  it('rejects a fetch failure with NetworkUnreachable carrying the endpoint and method', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    const err = await catchError(
      call('/platform/pg-meta/{ref}/query', {
        params: { path: { ref: 'abc' } },
      })
    )

    expect(err._tag).toBe('NetworkUnreachable')
    expect(err.message).toBe(NETWORK_UNREACHABLE_MESSAGE)
    expect(err.endpoint).toBe('/platform/pg-meta/{ref}/query')
    expect(err.method).toBe('GET')
    expect(err.service).toBe('pg-meta')
    expect(err.cause).toBeInstanceOf(TypeError)
  })

  it('rejects an abort with RequestAborted', async () => {
    mockFetch(async () => {
      throw new DOMException('The operation was aborted.', 'AbortError')
    })

    const err = await catchError(
      call('/platform/projects/{ref}', { params: { path: { ref: 'abc' } } })
    )

    expect(err._tag).toBe('RequestAborted')
    expect(err.endpoint).toBe('/platform/projects/{ref}')
    expect(err.method).toBe('GET')
  })
})

describe('error response middleware', () => {
  it('classifies a 500 with an empty body as PlatformError with its endpoint', async () => {
    const err = await failWith(
      new Response(null, { status: 500, headers: { 'Content-Length': '0' } })
    )
    expect(err._tag).toBe('PlatformError')
    expect(err.code).toBe(500)
    expect(err.endpoint).toBe('/platform/projects/{ref}')
    expect(err.method).toBe('GET')
    expect(err.requestId).toBe('test-uuid')
  })

  it('does not use an HTML body as the message', async () => {
    const err = await failWith(
      new Response('<html><body>Bad Gateway</body></html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      })
    )
    expect(err.code).toBe(502)
    expect(err.message).not.toContain('<html>')
    expect(err.message).toBe('API error happened while trying to communicate with the server.')
  })

  it('uses a short text/plain body as the message', async () => {
    const err = await failWith(
      new Response('  Service temporarily unavailable  ', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    )
    expect(err._tag).toBe('PlatformError')
    expect(err.message).toBe('Service temporarily unavailable')
  })

  it('ignores a text/plain body longer than the limit', async () => {
    const err = await failWith(
      new Response('x'.repeat(501), { status: 500, headers: { 'Content-Type': 'text/plain' } })
    )
    expect(err.message).toBe('API error happened while trying to communicate with the server.')
  })

  it('keeps a JSON error body and adds the endpoint, method, and service', async () => {
    const err = await failWith(
      new Response(JSON.stringify({ message: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    expect(err._tag).toBe('UnclassifiedApiError')
    expect(err.message).toBe('Project not found')
    expect(err.code).toBe(404)
    expect(err.endpoint).toBe('/platform/projects/{ref}')
    expect(err.method).toBe('GET')
    expect(err.service).toBe('management-api')
  })

  it('derives the pg-meta service from the endpoint', async () => {
    const err = await failWith(
      new Response(JSON.stringify({ message: 'nope' }), { status: 400 }),
      '/platform/pg-meta/{ref}/query'
    )
    expect(err.service).toBe('pg-meta')
  })
})

describe('fetchGet and fetchPost error responses', () => {
  it('resolves fetchGet to a PlatformError for a 502 HTML body', async () => {
    mockFetch(
      async () =>
        new Response('<html>Bad Gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        })
    )
    const result = await fetchGet('/api/thing')
    expect(result).toMatchObject({ _tag: 'PlatformError', code: 502 })
    expect((result as any).message).not.toContain('<html>')
  })

  it('uses the JSON message of a 400 from fetchPost', async () => {
    mockFetch(
      async () =>
        new Response(JSON.stringify({ message: 'Bad input' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
    )
    const result = await fetchPost('/api/thing', {})
    expect(result).toMatchObject({ code: 400, message: 'Bad input' })
  })
})

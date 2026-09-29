import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ResponseError } from '@/types/base'

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }))

vi.mock('@sentry/nextjs', () => ({ captureException }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { assertResponseHasBody, client } = await import('./fetchers')

const ENDPOINT = '/platform/projects/{ref}/config/storage'

function throwAndCatch(response: Response): unknown {
  try {
    assertResponseHasBody(response, ENDPOINT)
  } catch (e) {
    return e
  }
  throw new Error('assertResponseHasBody did not throw')
}

describe('assertResponseHasBody', () => {
  beforeEach(() => captureException.mockClear())

  it('does nothing for a response with a body', () => {
    const response = new Response(JSON.stringify({ features: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Content-Length': '15' },
    })

    expect(() => assertResponseHasBody(response, ENDPOINT)).not.toThrow()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('does nothing when Content-Length is absent (body is parsed by openapi-fetch)', () => {
    const response = new Response('[]', { status: 200 })

    expect(() => assertResponseHasBody(response, ENDPOINT)).not.toThrow()
  })

  it('throws a ResponseError for a 200 with Content-Length: 0', () => {
    const response = new Response(null, { status: 200, headers: { 'Content-Length': '0' } })

    const error = throwAndCatch(response)

    expect(error).toBeInstanceOf(ResponseError)
    expect((error as ResponseError).code).toBe(200)
    expect((error as ResponseError).requestPathname).toBe(ENDPOINT)
  })

  it('throws for a 204', () => {
    expect(throwAndCatch(new Response(null, { status: 204 }))).toBeInstanceOf(ResponseError)
  })

  it('reports the empty body to Sentry, grouped by endpoint', () => {
    const response = new Response(null, { status: 200, headers: { 'Content-Length': '0' } })

    const error = throwAndCatch(response)

    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        fingerprint: ['empty-response-body', ENDPOINT],
        tags: { endpoint: ENDPOINT },
      })
    )
  })
})

describe('openapi-fetch client: empty-body 200 on a GET', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('resolves as data `{}`, which assertResponseHasBody rejects', async () => {
    // An empty-body 200 without Content-Length (as seen over HTTP/3) is normalized to
    // `Content-Length: 0`, and openapi-fetch then resolves it as `data: {}`. That `{}` is typed as
    // the full StorageConfigResponse, so without the assertion `data.features.x` crashes.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 }))
    )

    const { data, error, response } = await client.GET(ENDPOINT, {
      params: { path: { ref: 'test-ref' } },
    })

    expect(error).toBeUndefined()
    expect(data).toEqual({})
    expect(() => assertResponseHasBody(response, ENDPOINT)).toThrow(ResponseError)
  })
})

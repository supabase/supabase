import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectionTimeoutError, UnknownAPIResponseError } from '@/types/api-errors'
import { ResponseError } from '@/types/base'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { fetchGet, fetchPost } = await import('./fetchers')

function mockFailedResponse(body: Record<string, unknown>, status = 500) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  )
}

const TIMEOUT_MESSAGE = 'CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT'

/**
 * `fetchGet`/`fetchPost` and the openapi-fetch client used to build errors through
 * two different paths, and only the latter ran pattern classification. These assert
 * both paths produce the same class so troubleshooting steps render either way.
 */
describe('fetch helpers — error classification', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('classifies a known error returned by fetchGet', async () => {
    mockFailedResponse({ message: TIMEOUT_MESSAGE }, 503)

    const error = await fetchGet('http://localhost/test')

    expect(error).toBeInstanceOf(ConnectionTimeoutError)
    expect((error as ConnectionTimeoutError).errorType).toBe('connection-timeout')
  })

  it('classifies a known error returned by fetchPost', async () => {
    mockFailedResponse({ message: TIMEOUT_MESSAGE }, 503)

    const error = await fetchPost('http://localhost/test', {})

    expect(error).toBeInstanceOf(ConnectionTimeoutError)
  })

  it('reads the message from the msg field', async () => {
    mockFailedResponse({ msg: TIMEOUT_MESSAGE }, 503)

    expect(await fetchGet('http://localhost/test')).toBeInstanceOf(ConnectionTimeoutError)
  })

  it('reads the message from the error field', async () => {
    mockFailedResponse({ error: TIMEOUT_MESSAGE }, 503)

    expect(await fetchGet('http://localhost/test')).toBeInstanceOf(ConnectionTimeoutError)
  })

  it('falls back to UnknownAPIResponseError for an unmatched message', async () => {
    mockFailedResponse({ message: 'some other failure' }, 500)

    const error = await fetchGet('http://localhost/test')

    expect(error).toBeInstanceOf(UnknownAPIResponseError)
    expect(error).toBeInstanceOf(ResponseError)
  })

  it('falls back to UnknownAPIResponseError when the body carries no message', async () => {
    mockFailedResponse({}, 500)

    const error = await fetchGet('http://localhost/test')

    expect(error).toBeInstanceOf(UnknownAPIResponseError)
    expect((error as ResponseError).message).toBe('An error has occurred: 500')
  })

  it('preserves status and the legacy `error` self-reference', async () => {
    mockFailedResponse({ message: TIMEOUT_MESSAGE }, 503)

    const error = (await fetchGet('http://localhost/test')) as ResponseError & {
      error: ResponseError
    }

    expect(error.code).toBe(503)
    expect(error.error).toBe(error)
  })

  it('classifies a thrown network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(TIMEOUT_MESSAGE)))

    expect(await fetchGet('http://localhost/test')).toBeInstanceOf(ConnectionTimeoutError)
  })
})

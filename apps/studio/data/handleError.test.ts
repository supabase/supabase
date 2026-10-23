import { describe, expect, it, vi } from 'vitest'

import { ConnectionTimeoutError, UnknownAPIResponseError } from '@/types/api-errors'
import { ResponseError } from '@/types/base'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { handleError } = await import('./fetchers')

function throwAndCatch(error: unknown): ResponseError {
  try {
    handleError(error)
  } catch (e) {
    return e as ResponseError
  }
  throw new Error('handleError did not throw')
}

describe('handleError — error classification', () => {
  // Pattern matching itself (case, whitespace, near-misses) is covered in error-patterns.test.ts.
  it.each([
    ['message', { message: 'CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT' }],
    ['msg', { msg: 'ERROR: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT' }],
  ])('classifies a known pattern from the %s field', (_, raw) => {
    const err = throwAndCatch(raw)
    expect(err).toBeInstanceOf(ConnectionTimeoutError)
    expect(err).toBeInstanceOf(ResponseError)
    expect((err as ConnectionTimeoutError).errorType).toBe('connection-timeout')
  })

  it.each([
    ['an unmatched message', { message: 'something went wrong' }],
    ['an empty message', { message: '' }],
    ['null', null],
    ['a non-object', 'raw string error'],
  ])('throws UnknownAPIResponseError for %s', (_, raw) => {
    const err = throwAndCatch(raw)
    expect(err).toBeInstanceOf(UnknownAPIResponseError)
    expect(err).toBeInstanceOf(ResponseError)
  })

  describe('field preservation', () => {
    it('preserves all ResponseError fields on classified errors', () => {
      const err = throwAndCatch({
        message: 'CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT',
        code: 503,
        requestId: 'req-abc',
        retryAfter: 30,
        requestPathname: '/rest/v1/table',
      })
      expect(err.message).toBe('CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT')
      expect(err.code).toBe(503)
      expect(err.requestId).toBe('req-abc')
      expect(err.retryAfter).toBe(30)
      expect(err.requestPathname).toBe('/rest/v1/table')
    })

    it('preserves all ResponseError fields on unclassified errors', () => {
      const err = throwAndCatch({ message: 'some error', code: 500, requestId: 'req-xyz' })
      expect(err.code).toBe(500)
      expect(err.requestId).toBe('req-xyz')
    })

    it('msg field takes priority over message field for error text', () => {
      const err = throwAndCatch({ msg: 'from msg field', message: 'from message field' })
      expect(err.message).toBe('from msg field')
    })

    it('preserves formattedError on classified errors', () => {
      const err = throwAndCatch({
        message: 'CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT',
        formattedError: 'ERROR: 08000: CONNECTION TERMINATED\nHINT: retry later',
      })
      expect(err).toBeInstanceOf(ConnectionTimeoutError)
      expect(err.formattedError).toBe('ERROR: 08000: CONNECTION TERMINATED\nHINT: retry later')
    })

    it('preserves formattedError on unclassified errors (permission denied with HINT)', () => {
      const err = throwAndCatch({
        message: 'permission denied for table users',
        code: 400,
        formattedError:
          'ERROR:  42501: permission denied for table users\n' +
          'HINT:  To grant access to anon on a specific table:\n' +
          '  GRANT SELECT ON TABLE public.users TO anon;',
      })
      expect(err).toBeInstanceOf(UnknownAPIResponseError)
      expect(err.formattedError).toContain('ERROR:')
      expect(err.formattedError).toContain('HINT:')
      expect(err.formattedError?.split('\n').length).toBeGreaterThan(1)
    })

    it('leaves formattedError undefined when raw error omits it', () => {
      const err = throwAndCatch({ message: 'some error' })
      expect(err.formattedError).toBeUndefined()
    })

    it('ignores non-string formattedError values', () => {
      const err = throwAndCatch({ message: 'some error', formattedError: 42 })
      expect(err.formattedError).toBeUndefined()
    })
  })
})

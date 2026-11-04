import { beforeEach, describe, expect, it, vi } from 'vitest'

import { classifyResponseError } from './error-classification'
import { ERROR_ROUTING } from '@/lib/errors/error-routing'
import {
  ConnectionTimeoutError,
  isStudioError,
  MalformedResponseError,
  NetworkUnreachableError,
  PlatformError,
  RequestAbortedError,
  UnclassifiedApiError,
  UnexpectedError,
  type StudioError,
} from '@/lib/errors/studio-errors'

const captureException = vi.hoisted(() => vi.fn(() => 'event-123'))
vi.mock('@sentry/nextjs', () => ({ captureException }))
vi.mock('common', () => ({ IS_PLATFORM: false, getAccessToken: vi.fn() }))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'test-uuid' }))

// Import after mocks are set up
const { handleError } = await import('./fetchers')

function throwAndCatch(error: unknown, options?: Parameters<typeof handleError>[1]): StudioError {
  try {
    handleError(error, options)
  } catch (e) {
    return e as StudioError
  }
  throw new Error('handleError did not throw')
}

beforeEach(() => {
  captureException.mockClear()
})

describe('handleError — error classification', () => {
  // Pattern matching itself (case, whitespace, near-misses) is covered in error-patterns.test.ts.
  it.each([
    ['message', { message: 'CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT' }],
    ['msg', { msg: 'ERROR: CONNECTION TERMINATED DUE TO CONNECTION TIMEOUT' }],
  ])('classifies a known pattern from the %s field as a rule', (_, raw) => {
    const err = throwAndCatch(raw)
    expect(err).toBeInstanceOf(ConnectionTimeoutError)
    expect(err._tag).toBe('DbConnectionTimeout')
    expect(err.classifiedBy).toBe('rule')
    expect(err.fault).toBe('platform')
  })

  it.each([
    ['500', { message: 'boom', code: 500 }, 'PlatformError', 'platform', true, 'server_error'],
    ['503', { message: 'boom', code: 503 }, 'PlatformError', 'platform', true, 'server_error'],
    [
      '400',
      { message: 'boom', code: 400 },
      'UnclassifiedApiError',
      'studio',
      false,
      'client_error',
    ],
    [
      '401',
      { message: 'boom', code: 401 },
      'UnclassifiedApiError',
      'studio',
      false,
      'unauthorized',
    ],
    ['403', { message: 'boom', code: 403 }, 'UnclassifiedApiError', 'studio', false, 'forbidden'],
    ['404', { message: 'boom', code: 404 }, 'UnclassifiedApiError', 'studio', false, 'not_found'],
    ['429', { message: 'boom', code: 429 }, 'UnclassifiedApiError', 'studio', true, 'rate_limited'],
    ['no status', { message: 'boom' }, 'UnexpectedError', 'studio', false, 'unexpected'],
    ['a 502 without a message', { code: 502 }, 'PlatformError', 'platform', true, 'server_error'],
    ['an empty message', { message: '' }, 'UnexpectedError', 'studio', false, 'unexpected'],
    ['null', null, 'UnexpectedError', 'studio', false, 'unexpected'],
    ['a string', 'raw string error', 'UnexpectedError', 'studio', false, 'unexpected'],
  ])('applies the default rules for %s', (_, raw, tag, fault, retryable, reason) => {
    const err = throwAndCatch(raw)
    expect(err._tag).toBe(tag)
    expect(err.fault).toBe(fault)
    expect(err.retryable).toBe(retryable)
    expect(err.reason).toBe(reason)
    expect(err.classifiedBy).toBe('default')
  })

  it('keeps the message for an error with a message but no status', () => {
    expect(throwAndCatch({ message: 'boom' }).message).toBe('boom')
  })

  it('uses the default message when there is none', () => {
    expect(throwAndCatch(null).message).toBe(
      'API error happened while trying to communicate with the server.'
    )
  })

  it('derives the service from the request pathname', () => {
    expect(
      throwAndCatch({ message: 'x', code: 500, requestPathname: '/platform/pg-meta/abc/query' })
        .service
    ).toBe('pg-meta')
  })

  describe('thrown errors', () => {
    it('classifies a native AbortError as RequestAborted without reporting it', () => {
      const err = throwAndCatch(new DOMException('The operation was aborted.', 'AbortError'))
      expect(err).toBeInstanceOf(RequestAbortedError)
      expect(err.fault).toBe('user')
      expect(err.retryable).toBe(false)
      expect(captureException).not.toHaveBeenCalled()
    })

    it('classifies a fetch-failure TypeError as NetworkUnreachable', () => {
      const err = throwAndCatch(new TypeError('Failed to fetch'))
      expect(err).toBeInstanceOf(NetworkUnreachableError)
      expect(err.fault).toBe('platform')
      expect(err.retryable).toBe(true)
      expect(err.reason).toBe('network_unreachable')
    })

    it('classifies any other TypeError as UnexpectedError and keeps its message', () => {
      const message = "Cannot read properties of undefined (reading 'x')"
      const err = throwAndCatch(new TypeError(message))
      expect(err).toBeInstanceOf(UnexpectedError)
      expect(err.fault).toBe('studio')
      expect(err.message).toBe(message)
    })
  })

  describe('already-tagged errors', () => {
    it('rethrows the same instance without reporting a routed-never tag', () => {
      const original = new RequestAbortedError({ message: 'aborted' })
      expect(throwAndCatch(original)).toBe(original)
      expect(captureException).not.toHaveBeenCalled()
    })

    it('reports once with alwaysCapture, then rethrows the same instance', () => {
      const original = new PlatformError({ message: 'boom', code: 500 })
      const options = { alwaysCapture: true, reportImmediately: true }
      expect(throwAndCatch(original, options)).toBe(original)
      expect(captureException).toHaveBeenCalledTimes(1)
      expect(original.errorEventId).toBe('event-123')

      throwAndCatch(original, options)
      expect(captureException).toHaveBeenCalledTimes(1)
    })
  })

  describe('reporting', () => {
    it('does not report by default; the query cache reports after the last retry', () => {
      throwAndCatch(null)
      throwAndCatch({ message: 'boom', code: 500 }, { alwaysCapture: true })
      expect(captureException).not.toHaveBeenCalled()
    })

    it('reports the fallthrough exactly once and records the event id', () => {
      const err = throwAndCatch(null, { reportImmediately: true })
      expect(err).toBeInstanceOf(UnexpectedError)
      expect(captureException).toHaveBeenCalledTimes(1)
      expect(err.errorEventId).toBe('event-123')
    })

    it('does not report routed-never tags unless alwaysCapture is set', () => {
      const abort = () => new DOMException('The operation was aborted.', 'AbortError')
      throwAndCatch(abort(), { reportImmediately: true })
      expect(captureException).not.toHaveBeenCalled()

      const err = throwAndCatch(abort(), {
        alwaysCapture: true,
        reportImmediately: true,
        sentryContext: { tags: { feature: 'x' } },
      })
      expect(captureException).toHaveBeenCalledTimes(1)
      expect(captureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({
          tags: expect.objectContaining({
            feature: 'x',
            error_tag: 'RequestAborted',
            fault: 'user',
            classified_by: 'rule',
            sample_rate: 1,
          }),
        })
      )
    })

    it('reports a thrown fetch failure at its routed rate, or at 1 with alwaysCapture', () => {
      throwAndCatch(new TypeError('Failed to fetch'), { reportImmediately: true })
      expect(captureException).toHaveBeenLastCalledWith(
        expect.any(NetworkUnreachableError),
        expect.objectContaining({
          tags: expect.objectContaining({
            sample_rate: ERROR_ROUTING.NetworkUnreachable.sentrySampleRate,
          }),
        })
      )

      throwAndCatch(new TypeError('Failed to fetch'), {
        alwaysCapture: true,
        reportImmediately: true,
      })
      expect(captureException).toHaveBeenLastCalledWith(
        expect.any(NetworkUnreachableError),
        expect.objectContaining({ tags: expect.objectContaining({ sample_rate: 1 }) })
      )
    })

    it('reports an UnexpectedError that has a message, following its routing', () => {
      const err = throwAndCatch(
        new TypeError("Cannot read properties of undefined (reading 'x')"),
        {
          reportImmediately: true,
        }
      )
      expect(err).toBeInstanceOf(UnexpectedError)
      expect(captureException).toHaveBeenCalledTimes(1)
      expect(captureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({
          tags: expect.objectContaining({
            sample_rate: ERROR_ROUTING.UnexpectedError.sentrySampleRate,
          }),
        })
      )
    })
  })

  describe('tag checks', () => {
    it('is an Error and recognized by isStudioError', () => {
      const err = throwAndCatch({ message: 'boom', code: 500 })
      expect(err).toBeInstanceOf(Error)
      expect(isStudioError(err)).toBe(true)
      expect(err.name).toBe('PlatformError')
      expect(err.stack).toBeTruthy()
    })

    it('does not treat plain errors or lookalikes as API errors', () => {
      expect(isStudioError(new Error('x'))).toBe(false)
      expect(isStudioError({ _tag: 'Nope' })).toBe(false)
      expect(isStudioError(null)).toBe(false)
    })

    it('applies the status default rules to hand-built ResponseErrors', () => {
      expect(classifyResponseError({ message: 'x', code: 502 })._tag).toBe('PlatformError')
      expect(classifyResponseError({ message: 'x', code: 502 }).fault).toBe('platform')
      expect(classifyResponseError({ message: 'x', code: 404 })._tag).toBe('UnclassifiedApiError')
      expect(classifyResponseError({ message: 'x', code: 404 }).fault).toBe('studio')
      expect(classifyResponseError({ message: 'x' })._tag).toBe('UnexpectedError')
      expect(new MalformedResponseError({}).fault).toBe('platform')
      expect(new UnclassifiedApiError({ code: 429 }).retryable).toBe(true)
    })
  })

  describe('field preservation', () => {
    it('preserves all fields on classified errors', () => {
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

    it('preserves all fields on unclassified errors', () => {
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
      expect(err).toBeInstanceOf(UnclassifiedApiError)
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

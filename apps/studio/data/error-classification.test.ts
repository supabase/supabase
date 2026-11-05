import { describe, expect, it, vi } from 'vitest'

import {
  classifyError,
  classifyResponseError,
  classifySqlResponseError,
  parseResponseErrorBody,
} from './error-classification'
import {
  ConnectionTimeoutError,
  getServiceForEndpoint,
  isNeverReportedError,
  NetworkUnreachableError,
  PlatformError,
  RequestAbortedError,
  StudioSqlError,
  UnexpectedError,
  UserSqlError,
} from '@/lib/errors/studio-errors'

describe('classifyError', () => {
  it('returns an already-tagged error unchanged', () => {
    const err = new PlatformError({ message: 'x', code: 500 })
    expect(classifyError(err)).toBe(err)
  })

  it.each([
    ['a DOMException', new DOMException('aborted', 'AbortError')],
    ['an Error named AbortError', Object.assign(new Error('aborted'), { name: 'AbortError' })],
  ])('maps %s to RequestAborted and keeps the cause', (_, thrown) => {
    const err = classifyError(thrown)
    expect(err).toBeInstanceOf(RequestAbortedError)
    expect(err.cause).toBe(thrown)
  })

  it.each(['Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed'])(
    'maps a fetch-failure TypeError (%s) to NetworkUnreachable',
    (message) => {
      expect(classifyError(new TypeError(message))).toBeInstanceOf(NetworkUnreachableError)
    }
  )

  it('attributes a fetch failure to the platform while online', () => {
    const err = classifyError(new TypeError('Failed to fetch'))
    expect(err.reason).toBe('network_unreachable')
    expect(err.fault).toBe('platform')
  })

  it("attributes a fetch failure to the user's network while offline", () => {
    vi.stubGlobal('navigator', { onLine: false })
    const err = classifyError(new TypeError('Failed to fetch'))
    vi.unstubAllGlobals()
    expect(err.reason).toBe('offline')
    expect(err.fault).toBe('user')
  })

  it('maps a programming-bug TypeError to UnexpectedError', () => {
    const err = classifyError(new TypeError("Cannot read properties of undefined (reading 'x')"))
    expect(err).toBeInstanceOf(UnexpectedError)
    expect(err.fault).toBe('studio')
  })

  it('maps anything else to UnexpectedError with the cause', () => {
    const thrown = new RangeError('nope')
    const err = classifyError(thrown, { endpoint: '/v1/projects/{ref}', method: 'GET' })
    expect(err).toBeInstanceOf(UnexpectedError)
    expect(err.cause).toBe(thrown)
    expect(err.service).toBe('management-api')
    expect(err.method).toBe('GET')
  })
})

describe('classifyResponseError', () => {
  it('passes endpoint and method through', () => {
    const err = classifyResponseError({
      message: 'x',
      code: 500,
      endpoint: '/platform/projects/{ref}',
      method: 'GET',
    })
    expect(err.endpoint).toBe('/platform/projects/{ref}')
    expect(err.service).toBe('management-api')
  })
})

describe('parseResponseErrorBody', () => {
  it('reads the fields the fetch middleware adds', () => {
    const body = { msg: 'boom', code: 503, requestId: 'r1', retryAfter: 5, requestPathname: '/x' }
    expect(parseResponseErrorBody(body)).toMatchObject({
      message: 'boom',
      code: 503,
      requestId: 'r1',
      retryAfter: 5,
      requestPathname: '/x',
    })
  })

  it('keeps the status of a body that has a code but no message', () => {
    expect(parseResponseErrorBody({ code: 500, retryAfter: 5 })).toMatchObject({
      message: undefined,
      code: 500,
      retryAfter: 5,
    })
  })

  it('returns undefined without a message or a code', () => {
    expect(parseResponseErrorBody({ requestId: 'r1' })).toBeUndefined()
    expect(parseResponseErrorBody(undefined)).toBeUndefined()
  })
})

describe('getServiceForEndpoint', () => {
  it.each([
    ['/platform/pg-meta/{ref}/query', 'pg-meta'],
    ['/v1/projects/{ref}/functions', 'management-api'],
    ['/platform/projects/{ref}', 'management-api'],
    ['/api/ai/sql', 'unknown'],
    [undefined, 'unknown'],
  ])('maps %s to %s', (endpoint, service) => {
    expect(getServiceForEndpoint(endpoint)).toBe(service)
  })
})

describe('classifySqlResponseError', () => {
  const sqlBody = {
    message: 'Failed to run sql query: ERROR:  42702: column reference "schemaname" is ambiguous',
    formattedError: 'ERROR:  42702: column reference "schemaname" is ambiguous\nLINE 32: ...',
    code: 400,
    endpoint: '/platform/pg-meta/{ref}/query',
  }

  it('classifies a Postgres error from user SQL as UserSqlError, which is never reported', () => {
    const err = classifySqlResponseError(sqlBody, { origin: 'user' })
    expect(err).toBeInstanceOf(UserSqlError)
    expect(err).toMatchObject({ fault: 'user', reason: 'user_sql', message: sqlBody.message })
    expect(isNeverReportedError(err)).toBe(true)
  })

  it('classifies a Postgres error from Studio SQL as StudioSqlError with the query key', () => {
    const err = classifySqlResponseError(sqlBody, {
      origin: 'studio',
      queryKey: 'projects-abc-tables',
    })
    expect(err).toBeInstanceOf(StudioSqlError)
    expect(err).toMatchObject({
      fault: 'studio',
      reason: 'studio_sql',
      queryKey: 'projects-abc-tables',
      formattedError: sqlBody.formattedError,
    })
    expect(isNeverReportedError(err)).toBe(false)
  })

  it.each([
    ['a 5xx', { message: 'boom', code: 500 }, PlatformError],
    [
      'a connection timeout',
      { message: 'Connection terminated due to connection timeout', code: 400 },
      ConnectionTimeoutError,
    ],
  ])('keeps the usual classification for %s', (_, body, ErrorClass) => {
    expect(classifySqlResponseError(body, { origin: 'user' })).toBeInstanceOf(ErrorClass)
  })

  it('classifies non-response errors with classifyError', () => {
    const thrown = new TypeError('Failed to fetch')
    expect(classifySqlResponseError(thrown, { origin: 'user' })).toBeInstanceOf(
      NetworkUnreachableError
    )
  })

  it('reads the SQLSTATE and keeps the Postgres position for the editor', () => {
    const err = classifySqlResponseError({ ...sqlBody, position: '8' }, { origin: 'user' })
    expect(err).toMatchObject({ sqlState: '42702', position: '8' })
  })

  it('sends Sentry only the SQLSTATE and query key for Studio SQL', () => {
    const err = classifySqlResponseError(sqlBody, { origin: 'studio', queryKey: 'tables-list' })
    expect(err.message).toBe(sqlBody.message)
    expect(err.sentryMessage).toBe('Postgres error 42702 in query tables-list')
  })
})

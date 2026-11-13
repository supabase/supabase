import { describe, expect, it, vi } from 'vitest'

import {
  classifyError,
  classifyResponseError,
  classifySqlResponseError,
  isRequestAborted,
  isUserFaultForSql,
  isUserFaultForValues,
  NETWORK_UNREACHABLE_MESSAGE,
  parseRateLimitResetSeconds,
  parseResponseErrorBody,
  parseRetryAfterSeconds,
  readResponseError,
} from './error-classification'
import {
  ConnectionTimeoutError,
  getServiceForEndpoint,
  isNeverReportedError,
  isUserError,
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

  it('keeps the user-facing copy and the original error for a fetch failure', () => {
    const thrown = new TypeError('Failed to fetch')
    const err = classifyError(thrown, { endpoint: '/platform/projects/{ref}', method: 'GET' })
    expect(err.message).toBe(NETWORK_UNREACHABLE_MESSAGE)
    expect(err.cause).toBe(thrown)
    expect(err.endpoint).toBe('/platform/projects/{ref}')
    expect(err.method).toBe('GET')
  })

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

describe('readResponseError', () => {
  const read = (text: string, headers: Record<string, string> = {}, status = 500) =>
    readResponseError({ status, headers: new Headers(headers), text })

  it('reads a JSON object body, preferring msg over message over error', () => {
    expect(read(JSON.stringify({ msg: 'a', message: 'b', error: 'c' })).message).toBe('a')
    expect(read(JSON.stringify({ message: 'b', error: 'c' })).message).toBe('b')
    expect(read(JSON.stringify({ error: 'c' })).message).toBe('c')
  })

  it('reads metadata and formattedError from a JSON body', () => {
    expect(read(JSON.stringify({ message: 'm', metadata: { a: 1 }, formattedError: 'f' }))).toEqual(
      { message: 'm', code: 500, metadata: { a: 1 }, formattedError: 'f' }
    )
  })

  it('ignores a JSON array or primitive body', () => {
    expect(read('[1,2]', { 'Content-Type': 'application/json' })).toEqual({ code: 500 })
    expect(read('"hi"')).toEqual({ code: 500 })
    expect(read('42')).toEqual({ code: 500 })
  })

  it('uses a short text/plain body as the trimmed message, case-insensitively', () => {
    expect(read('  down  ', { 'Content-Type': 'Text/Plain; charset=utf-8' }).message).toBe('down')
  })

  it('ignores a text/plain body longer than the limit', () => {
    expect(read('x'.repeat(501), { 'Content-Type': 'text/plain' }).message).toBeUndefined()
    expect(read('x'.repeat(500), { 'Content-Type': 'text/plain' }).message).toHaveLength(500)
  })

  it('ignores an HTML body', () => {
    expect(read('<html>bad</html>', { 'Content-Type': 'text/html' }).message).toBeUndefined()
  })

  it('returns only the status for an empty body', () => {
    expect(read('', {}, 502)).toEqual({ code: 502 })
  })

  it('reads retryAfter from Retry-After, then X-RateLimit-Reset', () => {
    expect(read('', { 'Retry-After': '7' }).retryAfter).toBe(7)
    expect(read('', { 'X-RateLimit-Reset': '9' }).retryAfter).toBe(9)
    expect(read('', { 'Retry-After': '7', 'X-RateLimit-Reset': '9' }).retryAfter).toBe(7)
    expect(read('').retryAfter).toBeUndefined()
  })

  it('falls back to X-RateLimit-Reset when Retry-After is malformed', () => {
    expect(read('', { 'Retry-After': '2015-10-21', 'X-RateLimit-Reset': '9' }).retryAfter).toBe(9)
  })

  it('reads retryAfter from an HTTP-date Retry-After', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2015-10-21T07:26:30Z'))
      expect(read('', { 'Retry-After': 'Wed, 21 Oct 2015 07:28:00 GMT' }).retryAfter).toBe(90)
    } finally {
      vi.useRealTimers()
    }
  })

  it('passes through requestId, endpoint, and method', () => {
    expect(
      readResponseError({
        status: 500,
        headers: new Headers(),
        text: '',
        requestId: 'r1',
        endpoint: '/x',
        method: 'GET',
      })
    ).toEqual({ code: 500, requestId: 'r1', endpoint: '/x', method: 'GET' })
  })
})

describe('parseRetryAfterSeconds', () => {
  const now = Date.parse('2015-10-21T07:26:30Z')

  it('parses delta-seconds', () => {
    expect(parseRetryAfterSeconds('120')).toBe(120)
    expect(parseRetryAfterSeconds(' 7 ')).toBe(7)
    expect(parseRetryAfterSeconds('0')).toBe(0)
  })

  it('parses an HTTP-date relative to now', () => {
    expect(parseRetryAfterSeconds('Wed, 21 Oct 2015 07:28:00 GMT', now)).toBe(90)
  })

  it('clamps past HTTP-dates to 0', () => {
    expect(parseRetryAfterSeconds('Wed, 21 Oct 2015 07:00:00 GMT', now)).toBe(0)
  })

  it.each([null, undefined, '', '-5', '1.5', '7abc', '2015-10-21', 'not a date'])(
    'returns undefined for %j',
    (value) => {
      expect(parseRetryAfterSeconds(value, now)).toBeUndefined()
    }
  )
})

describe('parseRateLimitResetSeconds', () => {
  const now = 1_700_000_000_000

  it('treats small values as delta-seconds', () => {
    expect(parseRateLimitResetSeconds('9', now)).toBe(9)
  })

  it('treats large values as epoch seconds', () => {
    expect(parseRateLimitResetSeconds('1700000060', now)).toBe(60)
    expect(parseRateLimitResetSeconds('1699999000', now)).toBe(0)
  })

  it.each([null, undefined, '', 'abc', '-1', '1.5'])('returns undefined for %j', (value) => {
    expect(parseRateLimitResetSeconds(value, now)).toBeUndefined()
  })
})

describe('parseResponseErrorBody', () => {
  it('reads a validated body, accepting msg as a message alias', () => {
    const body = { msg: 'boom', code: 503, requestId: 'r1', retryAfter: 5, endpoint: '/x' }
    expect(parseResponseErrorBody(body)).toMatchObject({
      message: 'boom',
      code: 503,
      requestId: 'r1',
      retryAfter: 5,
      endpoint: '/x',
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

  it('classifies a Postgres error from user SQL as a user-fault UserSqlError', () => {
    const err = classifySqlResponseError(sqlBody, { origin: 'user' })
    expect(err).toBeInstanceOf(UserSqlError)
    expect(err).toMatchObject({ reason: 'user_sql', message: sqlBody.message })
    expect(isUserError(err)).toBe(true)
  })

  it('never reports a UserSqlError', () => {
    const err = classifySqlResponseError(sqlBody, { origin: 'user' })
    expect(isNeverReportedError(err)).toBe(true)
  })

  it('classifies a Postgres error from Studio SQL as StudioSqlError with the query name', () => {
    const err = classifySqlResponseError(sqlBody, {
      origin: 'studio',
      queryName: 'tables',
    })
    expect(err).toBeInstanceOf(StudioSqlError)
    expect(err).toMatchObject({
      fault: 'studio',
      reason: 'studio_sql',
      queryName: 'tables',
      formattedError: sqlBody.formattedError,
    })
    expect(isUserError(err)).toBe(false)
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

  it('classifies Postgres errors as SQL errors even when the text matches a pattern rule', () => {
    const body = {
      message:
        'Failed to run sql query: ERROR:  P0001: Connection terminated due to connection timeout',
      code: 400,
    }
    expect(classifySqlResponseError(body, { origin: 'user' })).toBeInstanceOf(UserSqlError)
    expect(classifySqlResponseError(body, { origin: 'studio', queryName: 'x' })).toBeInstanceOf(
      StudioSqlError
    )
  })

  it.each([
    ['22P02', 'invalid input syntax for type integer: "abc"'],
    ['23505', 'duplicate key value violates unique constraint'],
    ['42501', 'permission denied for table todos'],
    ['P0001', 'raised by a trigger'],
    ['57014', 'canceling statement due to statement timeout'],
  ])(
    'classifies %s as a user-fault StudioSqlError (user_input) only when the caller passes a predicate that accepts it',
    (state, text) => {
      const body = { message: `Failed to run sql query: ERROR:  ${state}: ${text}`, code: 400 }
      const err = classifySqlResponseError(body, {
        origin: 'studio',
        queryName: 'table-rows',
        isUserFaultSqlState: isUserFaultForValues,
      })
      expect(err).toBeInstanceOf(StudioSqlError)
      expect(err).toMatchObject({
        fault: 'user',
        reason: 'user_input',
        sqlState: state,
        queryName: 'table-rows',
      })
      expect(isUserError(err)).toBe(true)
      expect(isNeverReportedError(err)).toBe(false)

      const studioOnly = classifySqlResponseError(body, { origin: 'studio', queryName: 'tables' })
      expect(studioOnly).toBeInstanceOf(StudioSqlError)
      expect(studioOnly).toMatchObject({ fault: 'studio', reason: 'studio_sql' })
      expect(isUserError(studioOnly)).toBe(false)
    }
  )

  it.each([
    ['42601', 'syntax error at or near "from"'],
    ['42P01', 'relation "x" does not exist'],
    ['42702', 'column reference is ambiguous'],
  ])('keeps Studio SQL failing with %s as a StudioSqlError even with user input', (state, text) => {
    const body = { message: `Failed to run sql query: ERROR:  ${state}: ${text}`, code: 400 }
    const err = classifySqlResponseError(body, {
      origin: 'studio',
      queryName: 'x',
      isUserFaultSqlState: isUserFaultForValues,
    })
    expect(err).toBeInstanceOf(StudioSqlError)
  })

  it('keeps Studio SQL without a SQLSTATE as a StudioSqlError', () => {
    const body = { message: 'Failed to run sql query: ERROR: odd', code: 400 }
    expect(
      classifySqlResponseError(body, {
        origin: 'studio',
        queryName: 'x',
        isUserFaultSqlState: isUserFaultForValues,
      })
    ).toBeInstanceOf(StudioSqlError)
  })

  it('keeps Studio SQL as studio_sql when the predicate rejects the SQLSTATE', () => {
    const body = { message: 'Failed to run sql query: ERROR:  22P02: bad', code: 400 }
    const err = classifySqlResponseError(body, {
      origin: 'studio',
      queryName: 'x',
      isUserFaultSqlState: () => false,
    })
    expect(err).toMatchObject({ fault: 'studio', reason: 'studio_sql' })
  })

  it('composes predicates for pg_stat_statements text: 42P02 is Studio, 42703 is the user', () => {
    const isUserFault = (s: string) => s !== '42P02' && isUserFaultForSql(s)
    const classify = (state: string) =>
      classifySqlResponseError(
        { message: `Failed to run sql query: ERROR:  ${state}: x`, code: 400 },
        { origin: 'studio', queryName: 'x', isUserFaultSqlState: isUserFault }
      )
    expect(classify('42P02')).toMatchObject({ fault: 'studio', reason: 'studio_sql' })
    expect(classify('42703')).toMatchObject({ fault: 'user', reason: 'user_input' })
  })

  it('keeps reason user_sql for user-written SQL even with a user-caused SQLSTATE', () => {
    const body = { message: 'Failed to run sql query: ERROR:  23505: dup', code: 400 }
    expect(classifySqlResponseError(body, { origin: 'user' })).toMatchObject({
      reason: 'user_sql',
    })
  })

  it('keeps a 400 without a SQLSTATE as a SQL error when no pattern matches', () => {
    const body = {
      message: 'Failed to run sql query: ERROR: could not determine which collation to use',
      code: 400,
    }
    expect(classifySqlResponseError(body, { origin: 'user' })).toBeInstanceOf(UserSqlError)
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

  it('sends Sentry only the SQLSTATE and query name for Studio SQL', () => {
    const err = classifySqlResponseError(sqlBody, { origin: 'studio', queryName: 'tables' })
    expect(err.message).toBe(sqlBody.message)
    expect(err.sentryMessage).toBe('Postgres error 42702 in query tables')
  })
})

describe('isRequestAborted', () => {
  it('accepts raw aborts and RequestAborted errors', () => {
    expect(isRequestAborted(new DOMException('aborted', 'AbortError'))).toBe(true)
    expect(isRequestAborted(new RequestAbortedError({ message: 'aborted' }))).toBe(true)
    expect(isRequestAborted(classifyError(new DOMException('aborted', 'AbortError')))).toBe(true)
  })

  it.each([
    ['a platform error', new PlatformError({ code: 500 })],
    ['a plain error', new Error('boom')],
    ['undefined', undefined],
    ['a string', 'AbortError'],
  ])('rejects %s', (_, value) => {
    expect(isRequestAborted(value)).toBe(false)
  })
})

describe('isUserFaultForValues', () => {
  it.each(['22P02', '22001', '23505', '23503', '42501', 'P0001', 'P0002', '57014'])(
    'accepts %s',
    (state) => expect(isUserFaultForValues(state)).toBe(true)
  )
  it.each(['42601', '42P01', '42703', '42702', '08006', '57P01', 'XX000', '53300'])(
    'rejects %s',
    (state) => expect(isUserFaultForValues(state)).toBe(false)
  )
})

describe('isUserFaultForSql', () => {
  it.each([
    '42601',
    '42P01',
    '42703',
    '42P02',
    '22P02',
    '23505',
    '42501',
    'P0001',
    '57014',
    '0A000',
  ])('accepts %s', (state) => expect(isUserFaultForSql(state)).toBe(true))
  it.each(['08006', '08001', '53300', '53200', '57P01', '57P03', '58030', 'XX000', 'XX001'])(
    'rejects %s, which describes the server',
    (state) => expect(isUserFaultForSql(state)).toBe(false)
  )
})

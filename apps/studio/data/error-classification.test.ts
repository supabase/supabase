import { describe, expect, it, vi } from 'vitest'

import {
  classifyError,
  classifyResponseError,
  isRequestAborted,
  NETWORK_UNREACHABLE_MESSAGE,
  parseResponseErrorBody,
  readResponseError,
} from './error-classification'
import {
  getServiceForEndpoint,
  NetworkUnreachableError,
  PlatformError,
  RequestAbortedError,
  UnexpectedError,
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

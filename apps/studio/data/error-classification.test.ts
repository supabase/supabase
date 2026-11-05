import { describe, expect, it, vi } from 'vitest'

import {
  classifyError,
  classifyResponseError,
  parseResponseErrorBody,
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

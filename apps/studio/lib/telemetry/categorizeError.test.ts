import { describe, expect, it } from 'vitest'

import { ConnectionTimeoutError } from '@/types/api-errors'
import { ResponseError } from '@/types/base'
import { categorizeError } from './categorizeError'

describe('categorizeError', () => {
  it('uses the explicit errorType and code from a classified API error', () => {
    const error = new ConnectionTimeoutError('upstream request timeout', 504)
    expect(categorizeError(error)).toEqual({
      errorCode: 504,
      errorType: 'connection-timeout',
    })
  })

  it('maps a ResponseError status code to a taxonomy value', () => {
    expect(categorizeError(new ResponseError('Unauthorized', 401))).toEqual({
      errorCode: 401,
      errorType: 'unauthorized',
    })
    expect(categorizeError(new ResponseError('Forbidden', 403))).toEqual({
      errorCode: 403,
      errorType: 'forbidden',
    })
    expect(categorizeError(new ResponseError('Server boom', 500))).toEqual({
      errorCode: 500,
      errorType: 'server-error',
    })
  })

  it('classifies a plain object carrying a numeric code/status', () => {
    expect(categorizeError({ message: 'nope', status: 404 })).toEqual({
      errorCode: 404,
      errorType: 'not-found',
    })
  })

  it('classifies transport failures from the message without leaking it', () => {
    expect(categorizeError('NetworkError when attempting to fetch resource')).toEqual({
      errorCode: 'network',
      errorType: 'network-error',
    })
    expect(categorizeError({ message: 'Request timed out' })).toEqual({
      errorCode: 'timeout',
      errorType: 'timeout',
    })
    expect(categorizeError('Canceled')).toEqual({ errorType: 'canceled' })
  })

  it('extracts an embedded status code from a message string', () => {
    expect(categorizeError('Failed with 503 Service Unavailable')).toEqual({
      errorCode: 503,
      errorType: 'server-error',
    })
  })

  it('never returns the raw message and falls back to unknown', () => {
    const result = categorizeError('Failed to load table public.users for user a@b.com')
    expect(result).toEqual({ errorType: 'unknown' })
    expect(JSON.stringify(result)).not.toContain('a@b.com')
    expect(JSON.stringify(result)).not.toContain('public.users')
  })

  it('handles null/undefined defensively', () => {
    expect(categorizeError(null)).toEqual({ errorType: 'unknown' })
    expect(categorizeError(undefined)).toEqual({ errorType: 'unknown' })
  })
})

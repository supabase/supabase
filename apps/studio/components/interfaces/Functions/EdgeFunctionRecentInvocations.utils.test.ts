import { describe, expect, it } from 'vitest'

import { parseEdgeFunctionEventMessage } from './EdgeFunctionRecentInvocations.utils'

describe('parseEdgeFunctionEventMessage', () => {
  it('should strip method and status code when they match the structured fields', () => {
    const message = 'POST | 200 | https://example.supabase.red/functions/v1/hello-world'
    expect(parseEdgeFunctionEventMessage(message, 'POST', '200')).toBe(
      'https://example.supabase.red/functions/v1/hello-world'
    )
  })

  it('should strip method and status code for different HTTP methods', () => {
    const message = 'GET | 404 | https://example.supabase.red/functions/v1/not-found'
    expect(parseEdgeFunctionEventMessage(message, 'GET', '404')).toBe(
      'https://example.supabase.red/functions/v1/not-found'
    )
  })

  it('should strip method and status code for 500 errors', () => {
    const message = 'POST | 500 | https://example.supabase.red/functions/v1/broken'
    expect(parseEdgeFunctionEventMessage(message, 'POST', '500')).toBe(
      'https://example.supabase.red/functions/v1/broken'
    )
  })

  it('should preserve the rest of the message when it contains pipe separators', () => {
    const message = 'POST | 200 | some | complex | message'
    expect(parseEdgeFunctionEventMessage(message, 'POST', '200')).toBe('some | complex | message')
  })

  it('should return original message when method does not match', () => {
    const message = 'POST | 200 | https://example.supabase.red/functions/v1/hello-world'
    expect(parseEdgeFunctionEventMessage(message, 'GET', '200')).toBe(message)
  })

  it('should return original message when status code does not match', () => {
    const message = 'POST | 200 | https://example.supabase.red/functions/v1/hello-world'
    expect(parseEdgeFunctionEventMessage(message, 'POST', '500')).toBe(message)
  })

  it('should return original message when method is undefined', () => {
    const message = 'POST | 200 | https://example.supabase.red/functions/v1/hello-world'
    expect(parseEdgeFunctionEventMessage(message, undefined, '200')).toBe(message)
  })

  it('should return original message when status code is undefined', () => {
    const message = 'POST | 200 | https://example.supabase.red/functions/v1/hello-world'
    expect(parseEdgeFunctionEventMessage(message, 'POST', undefined)).toBe(message)
  })

  it('should return original message when both method and status code are undefined', () => {
    const message = 'POST | 200 | https://example.supabase.red/functions/v1/hello-world'
    expect(parseEdgeFunctionEventMessage(message, undefined, undefined)).toBe(message)
  })

  it('should return original message when format has fewer than 3 parts', () => {
    const message = 'some simple message'
    expect(parseEdgeFunctionEventMessage(message, 'POST', '200')).toBe(message)
  })

  it('should return original message when format has only 2 pipe-separated parts', () => {
    const message = 'POST | 200'
    expect(parseEdgeFunctionEventMessage(message, 'POST', '200')).toBe(message)
  })

  it('should return empty string for empty input', () => {
    expect(parseEdgeFunctionEventMessage('', 'POST', '200')).toBe('')
  })

  it('should handle whitespace around parts correctly', () => {
    const message = 'POST | 200 | https://example.supabase.red/functions/v1/hello-world'
    expect(parseEdgeFunctionEventMessage(message, 'POST', '200')).toBe(
      'https://example.supabase.red/functions/v1/hello-world'
    )
  })

  it('should return original message when the message does not follow the expected format', () => {
    const message = 'Error: function crashed unexpectedly'
    expect(parseEdgeFunctionEventMessage(message, 'POST', '500')).toBe(message)
  })

  it('should handle messages with extra whitespace in the URL portion', () => {
    const message = 'DELETE | 204 |  '
    expect(parseEdgeFunctionEventMessage(message, 'DELETE', '204')).toBe('')
  })
})

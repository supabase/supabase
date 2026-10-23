import { describe, expect, it } from 'vitest'

import { parseEdgeFunctionEventMessage } from './EdgeFunctionRecentInvocations.utils'

const URL_MESSAGE = 'POST | 200 | https://example.supabase.red/functions/v1/hello-world'

describe('parseEdgeFunctionEventMessage', () => {
  it.each([
    ['POST', '200', URL_MESSAGE, 'https://example.supabase.red/functions/v1/hello-world'],
    [
      'GET',
      '404',
      'GET | 404 | https://example.supabase.red/functions/v1/not-found',
      'https://example.supabase.red/functions/v1/not-found',
    ],
    ['POST', '200', 'POST | 200 | some | complex | message', 'some | complex | message'],
    ['DELETE', '204', 'DELETE | 204 |  ', ''],
  ])(
    'strips the %s %s prefix when it matches the structured fields',
    (method, status, message, expected) => {
      expect(parseEdgeFunctionEventMessage(message, method, status)).toBe(expected)
    }
  )

  it.each([
    ['method does not match', URL_MESSAGE, 'GET', '200'],
    ['status code does not match', URL_MESSAGE, 'POST', '500'],
    ['method is undefined', URL_MESSAGE, undefined, '200'],
    ['status code is undefined', URL_MESSAGE, 'POST', undefined],
    ['the message is not pipe-separated', 'Error: function crashed unexpectedly', 'POST', '500'],
    ['the message has only 2 parts', 'POST | 200', 'POST', '200'],
    ['the message is empty', '', 'POST', '200'],
  ])('returns the original message when %s', (_, message, method, status) => {
    expect(parseEdgeFunctionEventMessage(message, method, status)).toBe(message)
  })
})

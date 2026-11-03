import * as Sentry from '@sentry/nextjs'
import { describe, expect, it, vi } from 'vitest'

import { captureCriticalError } from './error-reporting'
import { StudioError } from '@/lib/errors/studio-errors'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  withScope: vi.fn((cb: (scope: any) => void) => {
    const scope = { setTag: vi.fn() }
    cb(scope)
  }),
}))

describe('captureCriticalError', () => {
  it.each<[string, Parameters<typeof captureCriticalError>[0]]>([
    ['an object with an empty message', { message: '' }],
    ['an Error with an empty message', new Error('')],
    ['an object without a message', { foo: 'bar' } as unknown as { message: string }],
    ['a whitelisted message', new Error('email must be an email')],
    [
      'a message containing a whitelisted message',
      new Error('User error: A user with this email already exists in the system'),
    ],
    [
      'a whitelisted password error',
      new Error('Password is known to be weak and easy to guess, please choose a different one'),
    ],
    ['a whitelisted TOTP error', new Error('Invalid TOTP code entered')],
    ['a whitelisted project name error', new Error('name should not contain a . string')],
    ['a 4XX StudioError', new StudioError('Not found', 404, undefined, undefined, '/api/test')],
    [
      'a StudioError at the 4XX boundary (499)',
      new StudioError('Client closed request', 499, undefined, undefined, '/api/test'),
    ],
  ])('does not capture %s', (_, error) => {
    captureCriticalError(error, 'context')

    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it.each<[string, Parameters<typeof captureCriticalError>[0], string]>([
    ['a regular Error', new Error('Database connection failed'), 'Database connection failed'],
    [
      'a message similar to, but not matching, a whitelisted one',
      new Error('email format is invalid'),
      'email format is invalid',
    ],
    ['an unknown object with a message', { message: 'Custom error object' }, 'Custom error object'],
    [
      'a StudioError at the 5XX boundary (500)',
      new StudioError('Internal server error', 500, undefined, undefined, '/api/test'),
      'requestPathname /api/test w/ message: Internal server error',
    ],
    [
      'a 5XX StudioError',
      new StudioError('Gateway timeout', 504, undefined, undefined, '/api/gateway'),
      'requestPathname /api/gateway w/ message: Gateway timeout',
    ],
    [
      'a StudioError without code or requestPathname',
      new StudioError('Unknown error'),
      'Response Error (no code or requestPathname) w/ message: Unknown error',
    ],
  ])('captures %s', (_, error, message) => {
    captureCriticalError(error, 'context')

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message, name: 'CriticalError' })
    )
  })
})

import * as Sentry from '@sentry/nextjs'
import { ResponseError } from 'types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { captureCriticalError } from './error-reporting'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  withScope: vi.fn((cb: (scope: any) => void) => {
    const scope = { setTag: vi.fn() }
    cb(scope)
  }),
}))

describe('error-reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('captureCriticalError', () => {
    it('should not capture error if message is empty', () => {
      const error = { message: '' }
      captureCriticalError(error, 'test context')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should capture regular Error objects', () => {
      const error = new Error('Something went wrong')
      captureCriticalError(error, 'test action')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Something went wrong', name: 'CriticalError' })
      )
    })

    it('should not capture whitelisted error messages', () => {
      const error = new Error('email must be an email')
      captureCriticalError(error, 'validation')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should not capture errors with partial whitelisted message', () => {
      const error = new Error('User error: A user with this email already exists in the system')
      captureCriticalError(error, 'sign up')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should capture errors that are not whitelisted', () => {
      const error = new Error('Database connection failed')
      captureCriticalError(error, 'database')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Database connection failed', name: 'CriticalError' })
      )
    })

    it('should capture 5XX ResponseError', () => {
      const error = new ResponseError(
        'Internal server error',
        500,
        undefined,
        undefined,
        '/api/test'
      )
      captureCriticalError(error, 'api call')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'requestPathname /api/test w/ message: Internal server error',
          name: 'CriticalError',
        })
      )
    })

    it('should not capture 4XX ResponseError', () => {
      const error = new ResponseError('Not found', 404, undefined, undefined, '/api/test')
      captureCriticalError(error, 'api call')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should capture ResponseError with 5XX status code', () => {
      const error = new ResponseError('Gateway timeout', 504, undefined, undefined, '/api/gateway')
      captureCriticalError(error, 'gateway request')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'requestPathname /api/gateway w/ message: Gateway timeout',
          name: 'CriticalError',
        })
      )
    })

    it('should capture ResponseError without code or requestPathname', () => {
      const error = new ResponseError('Unknown error')
      captureCriticalError(error, 'unknown')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Response Error (no code or requestPathname) w/ message: Unknown error',
          name: 'CriticalError',
        })
      )
    })

    it('should capture unknown error objects with message property', () => {
      const error = { message: 'Custom error object' }
      captureCriticalError(error, 'custom')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Custom error object', name: 'CriticalError' })
      )
    })

    it('should not capture unknown error without message', () => {
      const error = { foo: 'bar' }
      captureCriticalError(error as any, 'no message')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should not capture whitelisted password validation error', () => {
      const error = new Error(
        'Password is known to be weak and easy to guess, please choose a different one'
      )
      captureCriticalError(error, 'password update')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should not capture whitelisted TOTP error', () => {
      const error = new Error('Invalid TOTP code entered')
      captureCriticalError(error, 'mfa verification')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should not capture whitelisted project name error', () => {
      const error = new Error('name should not contain a . string')
      captureCriticalError(error, 'create project')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should capture non-whitelisted errors even if similar to whitelisted ones', () => {
      const error = new Error('email format is invalid')
      captureCriticalError(error, 'validation')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'email format is invalid', name: 'CriticalError' })
      )
    })

    it('should handle Error objects with empty message', () => {
      const error = new Error('')
      captureCriticalError(error, 'empty error')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should handle ResponseError at boundary of 4XX/5XX (499)', () => {
      const error = new ResponseError(
        'Client closed request',
        499,
        undefined,
        undefined,
        '/api/test'
      )
      captureCriticalError(error, 'request')

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })

    it('should handle ResponseError at boundary of 4XX/5XX (500)', () => {
      const error = new ResponseError('Internal error', 500, undefined, undefined, '/api/test')
      captureCriticalError(error, 'request')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'requestPathname /api/test w/ message: Internal error',
          name: 'CriticalError',
        })
      )
    })
  })
})

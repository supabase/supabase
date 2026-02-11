import * as Sentry from '@sentry/nextjs'
import { ResponseError } from 'types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { captureCriticalError } from './error-reporting'

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
}))

describe('error-reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('captureCriticalError', () => {
    it('should not capture error if message is empty', () => {
      const error = { message: '' }
      captureCriticalError(error, 'test context')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should capture regular Error objects', () => {
      const error = new Error('Something went wrong')
      captureCriticalError(error, 'test action')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][test action] Failed: Something went wrong'
      )
    })

    it('should not capture whitelisted error messages', () => {
      const error = new Error('email must be an email')
      captureCriticalError(error, 'validation')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture errors with partial whitelisted message', () => {
      const error = new Error('User error: A user with this email already exists in the system')
      captureCriticalError(error, 'sign up')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should capture errors that are not whitelisted', () => {
      const error = new Error('Database connection failed')
      captureCriticalError(error, 'database')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][database] Failed: Database connection failed'
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

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][api call] Failed: requestPathname /api/test w/ message: Internal server error'
      )
    })

    it('should not capture 4XX ResponseError', () => {
      const error = new ResponseError('Not found', 404, undefined, undefined, '/api/test')
      captureCriticalError(error, 'api call')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should capture ResponseError with 5XX status code', () => {
      const error = new ResponseError('Gateway timeout', 504, undefined, undefined, '/api/gateway')
      captureCriticalError(error, 'gateway request')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][gateway request] Failed: requestPathname /api/gateway w/ message: Gateway timeout'
      )
    })

    it('should capture ResponseError without code or requestPathname', () => {
      const error = new ResponseError('Unknown error')
      captureCriticalError(error, 'unknown')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][unknown] Failed: Response Error (no code or requestPathname) w/ message: Unknown error'
      )
    })

    it('should capture unknown error objects with message property', () => {
      const error = { message: 'Custom error object' }
      captureCriticalError(error, 'custom')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][custom] Failed: Custom error object'
      )
    })

    it('should not capture unknown error without message', () => {
      const error = { foo: 'bar' }
      captureCriticalError(error as any, 'no message')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture whitelisted password validation error', () => {
      const error = new Error(
        'Password is known to be weak and easy to guess, please choose a different one'
      )
      captureCriticalError(error, 'password update')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture whitelisted TOTP error', () => {
      const error = new Error('Invalid TOTP code entered')
      captureCriticalError(error, 'mfa verification')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture whitelisted project name error', () => {
      const error = new Error('name should not contain a . string')
      captureCriticalError(error, 'create project')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should capture non-whitelisted errors even if similar to whitelisted ones', () => {
      const error = new Error('email format is invalid')
      captureCriticalError(error, 'validation')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][validation] Failed: email format is invalid'
      )
    })

    it('should handle Error objects with empty message', () => {
      const error = new Error('')
      captureCriticalError(error, 'empty error')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
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

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should handle ResponseError at boundary of 4XX/5XX (500)', () => {
      const error = new ResponseError('Internal error', 500, undefined, undefined, '/api/test')
      captureCriticalError(error, 'request')

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][request] Failed: requestPathname /api/test w/ message: Internal error'
      )
    })
  })
})

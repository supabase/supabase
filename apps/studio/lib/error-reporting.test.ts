import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Sentry from '@sentry/nextjs'
import { captureCriticalError } from './error-reporting'
import { ResponseError } from 'types'

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
}))

describe('captureCriticalError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('with ResponseError', () => {
    it('should capture 5XX errors', () => {
      const error = new ResponseError('Internal server error', 500, undefined, undefined, '/api/test')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][test operation] Failed: requestPathname /api/test w/ message: Internal server error'
      )
    })

    it('should not capture 4XX errors', () => {
      const error = new ResponseError('Bad request', 400, undefined, undefined, '/api/test')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should capture errors without code or requestPathname', () => {
      const error = new ResponseError('Error message')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][test operation] Failed: Response Error (no code or requestPathname) w/ message: Error message'
      )
    })
  })

  describe('with Error', () => {
    it('should capture Error instances', () => {
      const error = new Error('Something went wrong')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][test operation] Failed: Something went wrong'
      )
    })

    it('should not capture errors without message', () => {
      const error = new Error('')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
  })

  describe('with unknown error objects', () => {
    it('should capture errors with message property', () => {
      const error = { message: 'Unknown error occurred' }
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        '[CRITICAL][test operation] Failed: Unknown error occurred'
      )
    })

    it('should not capture errors without message property', () => {
      const error = { code: 500 }
      const context = 'test operation'

      captureCriticalError(error as any, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture non-object errors', () => {
      const error = 'string error'
      const context = 'test operation'

      captureCriticalError(error as any, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
  })

  describe('whitelist filtering', () => {
    it('should not capture whitelisted validation errors', () => {
      const error = new Error('email must be an email')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture whitelisted authentication errors', () => {
      const error = new Error('A user with this email already exists')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture whitelisted project creation errors', () => {
      const error = new Error('There are overdue invoices in the organization(s)')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture errors that contain whitelisted text as substring', () => {
      const error = new Error('email must be an email, but also something else')
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
  })

  describe('error without message', () => {
    it('should not capture errors with empty message', () => {
      const error = { message: '' }
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('should not capture errors with null message', () => {
      const error = { message: null } as any
      const context = 'test operation'

      captureCriticalError(error, context)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
  })
})


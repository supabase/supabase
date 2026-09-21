import type { FieldErrors } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { classifyApiError, classifyStripeError, classifyValidationError } from './funnel-errors'

describe('classifyApiError', () => {
  it('classifies connection timeout as network', () => {
    expect(classifyApiError('signup', { errorType: 'connection-timeout' })).toEqual({
      errorCategory: 'network',
      errorReason: 'connection_timeout',
    })
  })

  it('classifies a missing status code as network_error', () => {
    expect(classifyApiError('project_creation', { message: 'Failed to fetch' })).toEqual({
      errorCategory: 'network',
      errorReason: 'network_error',
    })
  })

  it('classifies 429 as rate_limited regardless of message', () => {
    expect(classifyApiError('signup', { code: 429, message: 'whatever' })).toEqual({
      errorCategory: 'api',
      errorReason: 'rate_limited',
      errorCode: 429,
    })
  })

  it('classifies 5xx as server_error', () => {
    expect(classifyApiError('org_creation', { code: 500, message: 'boom' })).toEqual({
      errorCategory: 'api',
      errorReason: 'server_error',
      errorCode: 500,
    })
  })

  it('matches a known 4xx signup message to a reason slug', () => {
    expect(classifyApiError('signup', { code: 400, message: 'User already registered' })).toEqual({
      errorCategory: 'api',
      errorReason: 'email_already_registered',
      errorCode: 400,
    })
  })

  it('matches a known 4xx project message to a reason slug', () => {
    expect(
      classifyApiError('project_creation', {
        code: 403,
        message: 'Your organization can only have 2 projects',
      })
    ).toEqual({ errorCategory: 'api', errorReason: 'project_limit_reached', errorCode: 403 })
  })

  it('falls back to other for an unmapped 4xx message', () => {
    expect(classifyApiError('signup', { code: 400, message: 'totally novel error' })).toEqual({
      errorCategory: 'api',
      errorReason: 'other',
      errorCode: 400,
    })
  })

  describe('signin', () => {
    it('reads a GoTrue AuthError status as the code', () => {
      expect(
        classifyApiError('signin', { status: 400, message: 'Invalid login credentials' })
      ).toEqual({
        errorCategory: 'api',
        errorReason: 'invalid_credentials',
        errorCode: 400,
      })
    })

    it('classifies an unconfirmed email', () => {
      expect(classifyApiError('signin', { status: 400, message: 'Email not confirmed' })).toEqual({
        errorCategory: 'api',
        errorReason: 'email_not_confirmed',
        errorCode: 400,
      })
    })

    it('classifies 429 via status as rate_limited', () => {
      expect(classifyApiError('signin', { status: 429, message: 'Rate limit exceeded' })).toEqual({
        errorCategory: 'api',
        errorReason: 'rate_limited',
        errorCode: 429,
      })
    })

    it('classifies a captcha failure', () => {
      expect(
        classifyApiError('signin', { status: 400, message: 'captcha verification process failed' })
      ).toEqual({ errorCategory: 'api', errorReason: 'captcha_failed', errorCode: 400 })
    })

    it('matches the SSO pattern before the 404 status map', () => {
      expect(
        classifyApiError('signin', {
          status: 404,
          message: 'No SSO provider assigned for this domain',
        })
      ).toEqual({ errorCategory: 'api', errorReason: 'sso_provider_not_found', errorCode: 404 })
    })

    it('classifies a redirect allow-list rejection', () => {
      expect(classifyApiError('signin', { status: 400, message: 'Invalid redirect URL' })).toEqual({
        errorCategory: 'api',
        errorReason: 'redirect_not_allowed',
        errorCode: 400,
      })
    })

    it('classifies a disabled provider', () => {
      expect(
        classifyApiError('signin', {
          status: 400,
          message: 'Unsupported provider: provider is not enabled',
        })
      ).toEqual({ errorCategory: 'api', errorReason: 'provider_not_enabled', errorCode: 400 })
    })

    it('classifies a GoTrue transport failure (status 0) as network_error, never api/other', () => {
      expect(
        classifyApiError('signin', {
          name: 'AuthRetryableFetchError',
          status: 0,
          message: 'Failed to fetch',
        })
      ).toEqual({ errorCategory: 'network', errorReason: 'network_error' })
    })

    it('classifies a retryable 5xx via status as server_error', () => {
      expect(classifyApiError('signin', { status: 503, message: 'Service unavailable' })).toEqual({
        errorCategory: 'api',
        errorReason: 'server_error',
        errorCode: 503,
      })
    })
  })
})

describe('classifyValidationError', () => {
  it('maps a signup password error to password_invalid', () => {
    expect(
      classifyValidationError('signup', { password: { type: 'too_small' } } as FieldErrors)
    ).toEqual({
      errorCategory: 'validation',
      errorReason: 'password_invalid',
    })
  })

  it('respects field priority (email before password)', () => {
    expect(
      classifyValidationError('signup', {
        email: { type: 'invalid' },
        password: { type: 'too_small' },
      } as FieldErrors)
    ).toEqual({ errorCategory: 'validation', errorReason: 'email_invalid' })
  })

  it('maps a signin password error to password_invalid', () => {
    expect(
      classifyValidationError('signin', { password: { type: 'too_small' } } as FieldErrors)
    ).toEqual({
      errorCategory: 'validation',
      errorReason: 'password_invalid',
    })
  })

  it('maps an org name error to org_name_missing', () => {
    expect(
      classifyValidationError('org_creation', { name: { type: 'too_small' } } as FieldErrors)
    ).toEqual({
      errorCategory: 'validation',
      errorReason: 'org_name_missing',
    })
  })

  it('falls back to other for an unmapped field', () => {
    expect(
      classifyValidationError('project_creation', { somethingNew: { type: 'x' } } as FieldErrors)
    ).toEqual({ errorCategory: 'validation', errorReason: 'other' })
  })
})

describe('classifyStripeError', () => {
  it('maps a decline_code to a card reason slug', () => {
    expect(
      classifyStripeError({ code: 'card_declined', decline_code: 'insufficient_funds' })
    ).toEqual({
      errorCategory: 'payment',
      errorReason: 'card_insufficient_funds',
    })
  })

  it('falls back to payment_failed for an unknown code', () => {
    expect(classifyStripeError({ code: 'mystery' })).toEqual({
      errorCategory: 'payment',
      errorReason: 'payment_failed',
    })
  })
})

import { describe, expect, test } from 'vitest'

import { getSubmissionErrorState, parseStripeAtlasLink } from './StripeAtlasApplication.utils'
import { ResponseError } from '@/types'

const encode = (payload: unknown) =>
  Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64')

describe('parseStripeAtlasLink', () => {
  test('returns the token and prefill fields from a full payload', () => {
    const search = `?data=${encodeURIComponent(
      encode({
        stripeAtlasToken: 'tok_123',
        firstname: 'Ada',
        lastname: 'Lovelace',
        email: 'ada@example.com',
        companyName: 'Analytical Engines',
      })
    )}`

    expect(parseStripeAtlasLink(search)).toEqual({
      status: 'ready',
      data: {
        stripeAtlasToken: 'tok_123',
        firstname: 'Ada',
        lastname: 'Lovelace',
        email: 'ada@example.com',
        companyName: 'Analytical Engines',
      },
    })
  })

  test('is ready with only a token, since the PII fields are all optional', () => {
    const search = `?data=${encodeURIComponent(encode({ stripeAtlasToken: 'tok_123' }))}`

    expect(parseStripeAtlasLink(search)).toEqual({
      status: 'ready',
      data: { stripeAtlasToken: 'tok_123' },
    })
  })

  test('decodes non-ASCII names', () => {
    const search = `?data=${encodeURIComponent(
      encode({ stripeAtlasToken: 'tok_123', firstname: 'Zoë', companyName: '株式会社' })
    )}`

    const result = parseStripeAtlasLink(search)

    expect(result.status).toBe('ready')
    expect(result.status === 'ready' && result.data.firstname).toBe('Zoë')
    expect(result.status === 'ready' && result.data.companyName).toBe('株式会社')
  })

  test('surfaces application_error verbatim', () => {
    const message = 'Unfortunately, something went wrong! Please reach out to Supabase support.'
    const search = `?application_error=${encodeURIComponent(message)}`

    expect(parseStripeAtlasLink(search)).toEqual({ status: 'application-error', message })
  })

  test('prefers application_error when both params are present', () => {
    const search = `?application_error=${encodeURIComponent('Boom')}&data=${encodeURIComponent(
      encode({ stripeAtlasToken: 'tok_123' })
    )}`

    expect(parseStripeAtlasLink(search)).toEqual({ status: 'application-error', message: 'Boom' })
  })

  test.each([
    ['no params', ''],
    ['empty data', '?data='],
    ['data that is not base64', '?data=!!!not-base64!!!'],
    ['base64 that is not JSON', `?data=${encodeURIComponent(btoa('not json'))}`],
    ['JSON without a token', `?data=${encodeURIComponent(encode({ email: 'a@b.com' }))}`],
    ['JSON with an empty token', `?data=${encodeURIComponent(encode({ stripeAtlasToken: '' }))}`],
    ['a JSON array', `?data=${encodeURIComponent(encode(['tok_123']))}`],
  ])('returns invalid-link for %s', (_label, search) => {
    expect(parseStripeAtlasLink(search)).toEqual({ status: 'invalid-link' })
  })
})

describe('getSubmissionErrorState', () => {
  test('treats an already-redeemed 400 as terminal', () => {
    const error = new ResponseError('A code for this partner user has already been redeemed', 400)

    const state = getSubmissionErrorState(error)

    expect(state.isRetryable).toBe(false)
    expect(state.message).toContain('already claimed')
  })

  test('surfaces other 400 messages from the server and allows retry', () => {
    const error = new ResponseError('email must be an email', 400)

    expect(getSubmissionErrorState(error)).toEqual({
      message: 'email must be an email',
      isRetryable: true,
    })
  })

  test('leads with retry on 404, because replica lag looks the same as a stale link', () => {
    const state = getSubmissionErrorState(new ResponseError('Not Found', 404))

    expect(state.isRetryable).toBe(true)
    expect(state.message).toContain('Try again in a minute')
  })

  test('uses the rate limit reset window on 429', () => {
    const error = new ResponseError('Too Many Requests', 429, undefined, 42)

    expect(getSubmissionErrorState(error)).toEqual({
      message: 'Too many attempts. Wait a moment before trying again.',
      isRetryable: true,
      retryAfterSeconds: 42,
    })
  })

  test('falls back to 60s when the reset header was not readable', () => {
    const state = getSubmissionErrorState(new ResponseError('Too Many Requests', 429))

    expect(state.retryAfterSeconds).toBe(60)
  })

  test('uses generic copy for 5xx rather than leaking the server message', () => {
    const state = getSubmissionErrorState(new ResponseError('connection reset by peer', 500))

    expect(state).toEqual({
      message: 'Unable to submit your application. Try again in a moment.',
      isRetryable: true,
    })
  })
})

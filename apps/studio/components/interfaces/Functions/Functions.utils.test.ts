import { describe, expect, it } from 'vitest'

import {
  formatInvokeHeaderArgs,
  getInvokeHeaders,
  USER_JWT_PLACEHOLDER,
} from './Functions.utils'

describe('getInvokeHeaders', () => {
  it('sends a legacy anon key on a single Authorization header', () => {
    const anonJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon'
    const headers = getInvokeHeaders({
      isPublishableKey: false,
      keyValue: anonJwt,
      verifyJwt: true,
      authJwt: USER_JWT_PLACEHOLDER,
    })

    expect(headers).toEqual([{ name: 'Authorization', value: `Bearer ${anonJwt}` }])
  })

  it('sends only the apikey header for a publishable key when verify_jwt is off', () => {
    const headers = getInvokeHeaders({
      isPublishableKey: true,
      keyValue: 'sb_publishable_abc123',
      verifyJwt: false,
      authJwt: USER_JWT_PLACEHOLDER,
    })

    expect(headers).toEqual([{ name: 'apikey', value: 'sb_publishable_abc123' }])
  })

  it('adds an Authorization header alongside apikey when verify_jwt is on', () => {
    const headers = getInvokeHeaders({
      isPublishableKey: true,
      keyValue: 'sb_publishable_abc123',
      verifyJwt: true,
      authJwt: USER_JWT_PLACEHOLDER,
    })

    expect(headers).toEqual([
      { name: 'apikey', value: 'sb_publishable_abc123' },
      { name: 'Authorization', value: `Bearer ${USER_JWT_PLACEHOLDER}` },
    ])
  })

  it('uses the provided authJwt value (e.g. the anon key) on the Authorization header', () => {
    const anonJwt = 'eyJ.anon'
    const headers = getInvokeHeaders({
      isPublishableKey: true,
      keyValue: 'sb_publishable_abc123',
      verifyJwt: true,
      authJwt: anonJwt,
    })

    expect(headers).toEqual([
      { name: 'apikey', value: 'sb_publishable_abc123' },
      { name: 'Authorization', value: `Bearer ${anonJwt}` },
    ])
  })
})

describe('formatInvokeHeaderArgs', () => {
  it('formats a single header as a cURL -H arg', () => {
    expect(
      formatInvokeHeaderArgs([{ name: 'apikey', value: '[YOUR PUBLISHABLE KEY]' }])
    ).toBe("-H 'apikey: [YOUR PUBLISHABLE KEY]'")
  })

  it('joins multiple headers with a space', () => {
    expect(
      formatInvokeHeaderArgs([
        { name: 'apikey', value: 'sb_publishable_abc123' },
        { name: 'Authorization', value: `Bearer ${USER_JWT_PLACEHOLDER}` },
      ])
    ).toBe(`-H 'apikey: sb_publishable_abc123' -H 'Authorization: Bearer ${USER_JWT_PLACEHOLDER}'`)
  })
})

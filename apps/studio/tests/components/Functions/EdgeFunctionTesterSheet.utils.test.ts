import { describe, expect, it } from 'vitest'

import { buildEdgeFunctionTestHeaders } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet.utils'

const PUBLISHABLE_KEY = 'sb_publishable_test_key'

describe('buildEdgeFunctionTestHeaders', () => {
  it('sends the API key on the apikey header', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [],
    })

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
    })
  })

  it('never generates an Authorization header', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [{ key: '', value: '' }],
    })

    expect(headers.Authorization).toBeUndefined()
    expect(headers.authorization).toBeUndefined()
  })

  it('omits apikey when no key is available', () => {
    const headers = buildEdgeFunctionTestHeaders({ apiKey: undefined, customHeaders: [] })

    expect(headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('keeps a user supplied Authorization header', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [{ key: 'Authorization', value: 'Bearer user-token' }],
    })

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      Authorization: 'Bearer user-token',
    })
  })

  it('keeps the apikey alongside several user rows', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [
        { key: 'Authorization', value: 'Bearer user-token' },
        { key: 'x-custom', value: 'kept' },
      ],
    })

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      Authorization: 'Bearer user-token',
      'x-custom': 'kept',
    })
  })

  it('lets a user row replace a generated header whatever its casing', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [
        { key: 'Apikey', value: 'sb_secret_manual_key' },
        { key: 'content-type', value: 'text/plain' },
      ],
    })

    expect(headers).toEqual({
      Apikey: 'sb_secret_manual_key',
      'content-type': 'text/plain',
    })
  })

  it('trims header names and drops incomplete rows', () => {
    const headers = buildEdgeFunctionTestHeaders({
      apiKey: PUBLISHABLE_KEY,
      customHeaders: [
        { key: '  x-spaced  ', value: 'value' },
        { key: 'x-no-value', value: '' },
        { key: '   ', value: 'orphan' },
      ],
    })

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      'x-spaced': 'value',
    })
  })
})

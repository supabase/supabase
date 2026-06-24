import { describe, expect, it } from 'vitest'

import { httpEndpointUrlSchema, isValidHttpEndpointUrl } from './http-url'

const schema = httpEndpointUrlSchema({
  requiredMessage: 'required',
  invalidMessage: 'invalid',
  prefixMessage: 'prefix',
})

describe('isValidHttpEndpointUrl', () => {
  it('accepts valid http and https endpoints', () => {
    expect(isValidHttpEndpointUrl('https://api.supabase.com/webhooks')).toBe(true)
    expect(isValidHttpEndpointUrl('http://localhost:3000/hooks')).toBe(true)
    expect(isValidHttpEndpointUrl('https://127.0.0.1:4318/v1/logs')).toBe(true)
    expect(isValidHttpEndpointUrl('https://[::1]:4318/v1/logs')).toBe(true)
  })

  it('rejects invalid endpoint URLs', () => {
    expect(isValidHttpEndpointUrl('https://webhook')).toBe(false)
    expect(isValidHttpEndpointUrl('ftp://api.supabase.com/webhooks')).toBe(false)
    expect(isValidHttpEndpointUrl('not a url')).toBe(false)
  })
})

describe('httpEndpointUrlSchema', () => {
  it('rejects empty values', () => {
    const result = schema.safeParse('')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('required')
    }
  })

  it('rejects URLs without an http or https prefix', () => {
    const result = schema.safeParse('api.supabase.com/webhooks')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('prefix')
    }
  })

  it('rejects incomplete hostnames', () => {
    const result = schema.safeParse('https://webhook')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('invalid')
    }
  })

  it('accepts valid endpoints after trimming', () => {
    const result = schema.safeParse(' https://api.supabase.com/webhooks ')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://api.supabase.com/webhooks')
    }
  })
})

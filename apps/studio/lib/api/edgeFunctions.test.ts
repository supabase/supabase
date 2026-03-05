import { describe, expect, it } from 'vitest'

import { isValidEdgeFunctionURL } from './edgeFunctions'

describe('isValidEdgeFunctionURL', () => {
  const validEdgeFunctionUrls = [
    'https://projectref.supabase.co/functions/v1/hello-world',
    'https://projectref.supabase.red/functions/v1/hello-world',
    'https://projectref.supabase.red/functions/v3/hello-world',
    'https://projectref.supabase.red/functions/v3/hello-world',
  ]

  const validLocalEdgeFunctionsUrls = [
    'https://projectref.notsupabase.com/functions/v1/test',
    'https://notsupabase.com/functions/v1/test',
    'http://localhost:54321/functions/v1/test-2',
    'http://kong:8000/functions/v1/hello-world',
    'https://127.0.0.1:54321/functions/v1/test-3',
    'https://127.0.0.1:54321/functions/v1/test-5',
  ]

  const invalidPlatformEdgeFunctionUrls = [
    'https://notsupabase.com/functions/v1/test',
    'https://projectref.notsupabase.com/functions/v1/test',
    'https://localhost?https://aaaa.supabase.co/functions/v1/xxx',
    'https://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
    'http://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
  ]

  const invalidEdgeFunctionUrls = [
    'https://localhost?https://aaaa.supabase.co/functions/v1/xxx',
    'https://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
    'http://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
  ]

  it('should match valid edge function URLs on platform', () => {
    for (const url of validEdgeFunctionUrls) {
      expect(isValidEdgeFunctionURL(url, true), `Expected ${url} to be valid`).toBe(true)
    }
  })

  it('should not match local URLs on platform', () => {
    for (const url of validLocalEdgeFunctionsUrls) {
      expect(isValidEdgeFunctionURL(url, true), `Expected ${url} to be invalid on platform`).toBe(
        false
      )
    }
  })

  it('should match valid local edge function URLs off platform', () => {
    for (const url of validLocalEdgeFunctionsUrls) {
      expect(isValidEdgeFunctionURL(url, false), `Expected ${url} to be valid`).toBe(true)
    }
  })

  it('should not match invalid edge function URLs on platform', () => {
    for (const url of invalidPlatformEdgeFunctionUrls) {
      expect(isValidEdgeFunctionURL(url, true), `Expected ${url} to be invalid`).toBe(false)
    }
  })

  it('should not match invalid edge function URLs off platform', () => {
    for (const url of invalidEdgeFunctionUrls) {
      expect(isValidEdgeFunctionURL(url, false), `Expected ${url} to be invalid`).toBe(false)
    }
  })
})

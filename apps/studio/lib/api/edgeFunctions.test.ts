import { expect, describe, it } from 'vitest'
import { isValidEdgeFunctionURL } from './edgeFunctions'

describe('isValidEdgeFunctionURL', () => {
  const validEdgeFunctionUrls = [
    'https://projectref.supabase.co/functions/v1/hello-world',
    'https://projectref.supabase.red/functions/v1/hello-world',
    'https://projectref.supabase.red/functions/v3/hello-world',
    'https://projectref.supabase.red/functions/v3/hello-world',
  ]

  const invalidEdgeFunctionUrls = [
    'https://notsupabase.com/functions/v1/test',
    'https://projectref.notsupabase.com/functions/v1/test',
    'https://localhost?https://aaaa.supabase.co/functions/v1/xxx',
    'https://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
    'http://localhost:3000/?https://aaaa.supabase.co/functions/v1/xxx',
  ]

  it('should match valid edge function URLs', () => {
    for (const url of validEdgeFunctionUrls) {
      expect(isValidEdgeFunctionURL(url), `Expected ${url} to be valid`).toBe(true)
    }
  })

  it('should not match invalid edge function URLs', () => {
    for (const url of invalidEdgeFunctionUrls) {
      expect(isValidEdgeFunctionURL(url), `Expected ${url} to be invalid`).toBe(false)
    }
  })
})

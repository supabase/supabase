import { describe, expect, it } from 'vitest'

import { getEdgeFunctionErrorMessage, isValidEdgeFunctionURL } from './edgeFunctions'

describe('isValidEdgeFunctionURL', () => {
  const validEdgeFunctionUrls = [
    'https://uniquetwentychararef.supabase.co/functions/v1/hello-world',
    'https://uniquetwentychararef.supabase.red/functions/v1/hello-world',
    'https://uniquetwentychararef.supabase.red/functions/v3/hello-world',
    'https://uniquetwentychararef.supabase.red/functions/v3/hello-world',
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

describe('getEdgeFunctionErrorMessage', () => {
  it('should extract message from self-hosted (Kong-fronted) error shape', () => {
    expect(getEdgeFunctionErrorMessage(JSON.stringify({ message: 'name resolution failed' }))).toBe(
      'name resolution failed'
    )
  })

  it('should extract message from platform error shape', () => {
    expect(
      getEdgeFunctionErrorMessage(JSON.stringify({ error: 'Missing authorization header' }))
    ).toBe('Missing authorization header')
  })

  it('should prefer `message` over `error` when both are present', () => {
    expect(
      getEdgeFunctionErrorMessage(JSON.stringify({ message: 'from message', error: 'from error' }))
    ).toBe('from message')
  })

  it('should fall back to `error` when `message` is not a string', () => {
    expect(getEdgeFunctionErrorMessage(JSON.stringify({ message: 42, error: 'from error' }))).toBe(
      'from error'
    )
  })

  it('should fall back to `error` when `message` is an empty string', () => {
    expect(getEdgeFunctionErrorMessage(JSON.stringify({ message: '', error: 'from error' }))).toBe(
      'from error'
    )
  })

  it('should return generic message when neither `message` nor `error` is a string', () => {
    expect(getEdgeFunctionErrorMessage(JSON.stringify({ code: 500 }))).toBe(
      'Edge function returned an error'
    )
  })

  it('should return generic message for an empty JSON object', () => {
    expect(getEdgeFunctionErrorMessage(JSON.stringify({}))).toBe('Edge function returned an error')
  })

  it('should return the raw body when it is not valid JSON', () => {
    expect(getEdgeFunctionErrorMessage('Internal Server Error')).toBe('Internal Server Error')
  })

  it('should return generic message when the raw body is empty', () => {
    expect(getEdgeFunctionErrorMessage('')).toBe('Edge function returned an error')
  })
})

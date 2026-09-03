import { describe, expect, it } from 'vitest'

import { corsHeaders, isAllowedOrigin } from './cors'

describe('isAllowedOrigin', () => {
  it.each([
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'https://supabase.com',
    'https://app.supabase.com',
    'https://supabase.green',
    'https://studio.supabase.green',
    'https://studio-staging-git-poc-assistant-app-supabase.vercel.app',
  ])('allows %s', (origin) => {
    expect(isAllowedOrigin(origin)).toBe(true)
  })

  it.each([
    'http://localhost:3000',
    'https://example.com',
    'https://supabase.red',
    'https://supabase.com.evil.example',
    'https://notsupabase.green',
    'https://random-app.vercel.app',
    'https://studio-staging-git-poc-assistant-app-supabase.vercel.app.evil.example',
  ])('rejects %s', (origin) => {
    expect(isAllowedOrigin(origin)).toBe(false)
  })
})

describe('corsHeaders', () => {
  it('reflects an allowed staging Studio origin', () => {
    const headers = corsHeaders(new Request('https://worker.example/v1/me', {
      headers: { Origin: 'https://supabase.green' },
    }))
    expect(headers['Access-Control-Allow-Origin']).toBe('https://supabase.green')
  })

  it('omits Allow-Origin for a disallowed origin', () => {
    const headers = corsHeaders(new Request('https://worker.example/v1/me', {
      headers: { Origin: 'https://example.com' },
    }))
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined()
  })
})

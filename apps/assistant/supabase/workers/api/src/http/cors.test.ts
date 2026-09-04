import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { assistantCors, isAllowedOrigin } from './cors'

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

describe('assistantCors', () => {
  const app = new Hono()
  app.use('*', assistantCors)
  app.get('/v1/me', (c) => c.json({ ok: true }))

  it('reflects an allowed staging Studio origin', async () => {
    const response = await app.request('/v1/me', {
      headers: { Origin: 'https://supabase.green' },
    })
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://supabase.green')
  })

  it('omits Allow-Origin for a disallowed origin', async () => {
    const response = await app.request('/v1/me', {
      headers: { Origin: 'https://example.com' },
    })
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})

import { describe, expect, test } from 'vitest'
import { buildEdgeFunctionUrl, isEdgeFunctionUrl } from './edge-functions'

describe('buildEdgeFunctionUrl', () => {
  test('cloud (.supabase.co) preserves subdomain pattern', () => {
    expect(buildEdgeFunctionUrl('hello', 'abc123', 'https://abc123.supabase.co')).toBe(
      'https://abc123.supabase.co/functions/v1/hello'
    )
  })

  test('cloud alternate TLD preserves subdomain pattern', () => {
    expect(buildEdgeFunctionUrl('hello', 'abc123', 'https://abc123.supabase.red')).toBe(
      'https://abc123.supabase.red/functions/v1/hello'
    )
  })

  test('self-hosted localhost uses restUrl origin', () => {
    expect(buildEdgeFunctionUrl('hello', 'default', 'http://localhost:8000')).toBe(
      'http://localhost:8000/functions/v1/hello'
    )
  })

  test('self-hosted internal docker service uses restUrl origin', () => {
    expect(buildEdgeFunctionUrl('hello', 'default', 'http://kong:8000')).toBe(
      'http://kong:8000/functions/v1/hello'
    )
  })

  test('self-hosted custom domain uses restUrl origin', () => {
    expect(buildEdgeFunctionUrl('hello', 'default', 'https://api.acme.example')).toBe(
      'https://api.acme.example/functions/v1/hello'
    )
  })

  test('self-hosted host that happens to contain "supabase" uses restUrl origin', () => {
    expect(buildEdgeFunctionUrl('hello', 'abc', 'https://foo.supabase.company.co')).toBe(
      'https://foo.supabase.company.co/functions/v1/hello'
    )
  })

  test('no restUrl falls back to .supabase.co', () => {
    expect(buildEdgeFunctionUrl('hello', 'abc123')).toBe(
      'https://abc123.supabase.co/functions/v1/hello'
    )
  })

  test('invalid restUrl falls back to .supabase.co', () => {
    expect(buildEdgeFunctionUrl('hello', 'abc123', 'not-a-url')).toBe(
      'https://abc123.supabase.co/functions/v1/hello'
    )
  })
})

describe('isEdgeFunctionUrl', () => {
  test('cloud .supabase.co with /functions/ is detected', () => {
    expect(
      isEdgeFunctionUrl(
        'https://abc123.supabase.co/functions/v1/hello',
        'abc123',
        'https://abc123.supabase.co'
      )
    ).toBe(true)
  })

  test('cloud .functions.supabase.co is detected (legacy pattern)', () => {
    expect(
      isEdgeFunctionUrl(
        'https://abc123.functions.supabase.co/hello',
        'abc123',
        'https://abc123.supabase.co'
      )
    ).toBe(true)
  })

  test('self-hosted localhost URL with /functions/v1/ is detected', () => {
    expect(
      isEdgeFunctionUrl(
        'http://localhost:8000/functions/v1/hello',
        'default',
        'http://localhost:8000'
      )
    ).toBe(true)
  })

  test('arbitrary external URL is not detected', () => {
    expect(
      isEdgeFunctionUrl('https://example.com/webhook', 'abc123', 'https://abc123.supabase.co')
    ).toBe(false)
  })

  test('cross-ref substring match is not detected', () => {
    // abc12 must not match a URL for project abc123
    expect(
      isEdgeFunctionUrl(
        'https://abc123.supabase.co/functions/v1/hello',
        'abc12',
        'https://abc12.supabase.co'
      )
    ).toBe(false)
  })

  test('empty url returns false', () => {
    expect(isEdgeFunctionUrl('', 'abc123', 'https://abc123.supabase.co')).toBe(false)
  })
})

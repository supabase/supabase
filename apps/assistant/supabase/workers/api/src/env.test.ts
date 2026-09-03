import { describe, expect, it } from 'vitest'

import { resolveAssistantJwks, resolveMcpUrl } from './env'

describe('resolveMcpUrl', () => {
  it('prefers an explicit MCP_URL', () => {
    expect(
      resolveMcpUrl({
        mcpUrl: 'http://127.0.0.1:9999/mcp',
        managementApiUrl: 'https://api.supabase.com',
      })
    ).toBe('http://127.0.0.1:9999/mcp')
  })

  it('maps hosted Management API hosts to their MCP host', () => {
    expect(resolveMcpUrl({ managementApiUrl: 'https://api.supabase.com' })).toBe(
      'https://mcp.supabase.com/mcp'
    )
    expect(resolveMcpUrl({ managementApiUrl: 'https://api.supabase.green/' })).toBe(
      'https://mcp.supabase.green/mcp'
    )
  })

  it('uses /mcp on the same origin for a local platform', () => {
    expect(resolveMcpUrl({ managementApiUrl: 'http://localhost:8080' })).toBe(
      'http://localhost:8080/mcp'
    )
  })
})

describe('resolveAssistantJwks', () => {
  it('prefers inline SUPABASE_JWKS', () => {
    const jwks = resolveAssistantJwks({
      inlineJwks: '{"keys":[{"kty":"oct","k":"abc"}]}',
      jwksUrl: 'https://example.supabase.co/auth/v1/.well-known/jwks.json',
      supabaseUrl: 'http://127.0.0.1:55321',
    })

    expect(jwks).toEqual({ keys: [{ kty: 'oct', k: 'abc' }] })
  })

  it('uses SUPABASE_JWKS_URL when inline JWKS is unset', () => {
    const jwks = resolveAssistantJwks({
      jwksUrl: 'https://example.supabase.co/auth/v1/.well-known/jwks.json',
      supabaseUrl: 'http://127.0.0.1:55321',
    })

    expect(jwks).toBeInstanceOf(URL)
    expect((jwks as URL).href).toBe('https://example.supabase.co/auth/v1/.well-known/jwks.json')
  })

  it('derives the well-known URL from SUPABASE_URL', () => {
    const jwks = resolveAssistantJwks({
      supabaseUrl: 'http://127.0.0.1:55321/',
    })

    expect(jwks).toBeInstanceOf(URL)
    expect((jwks as URL).href).toBe('http://127.0.0.1:55321/auth/v1/.well-known/jwks.json')
  })

  it('returns undefined when nothing is configured', () => {
    expect(resolveAssistantJwks({})).toBeUndefined()
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  describeDbHost,
  env,
  parseApiKeysDictionary,
  resolveAssistantJwks,
  resolveMcpUrl,
  supabaseServerEnv,
} from './env'

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

describe('OAuth env names', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads OAUTH_REDIRECT_URI', () => {
    vi.stubEnv('OAUTH_REDIRECT_URI', 'https://example.supabase.red/workers/v1/api/oauth/callback')
    expect(env.supabaseOauthRedirectUri).toBe(
      'https://example.supabase.red/workers/v1/api/oauth/callback'
    )
  })

  it('reads lowercase dashboard secret names', () => {
    vi.stubEnv('OAUTH_CLIENT_ID', '')
    vi.stubEnv('oauth_client_id', 'client-from-dashboard')
    expect(env.supabaseOauthClientId).toBe('client-from-dashboard')
  })
})

describe('supabaseServerEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('passes local UPPER_SNAKE values through to withSupabase', () => {
    vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:55321')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_local')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_local')
    vi.stubEnv('SUPABASE_JWKS', '')
    vi.stubEnv('SUPABASE_JWKS_URL', '')

    const resolved = supabaseServerEnv()

    expect(resolved.url).toBe('http://127.0.0.1:55321')
    expect(resolved.publishableKeys).toEqual({ default: 'sb_publishable_local' })
    expect(resolved.secretKeys).toEqual({ default: 'sb_secret_local' })
    expect(resolved.jwks).toEqual(new URL('http://127.0.0.1:55321/auth/v1/.well-known/jwks.json'))
  })

  it('reads the non-reserved ASSISTANT_* names a hosted worker can set', () => {
    clearProjectEnv()
    vi.stubEnv('ASSISTANT_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('ASSISTANT_PUBLISHABLE_KEY', 'sb_publishable_hosted')
    vi.stubEnv('ASSISTANT_SECRET_KEY', 'sb_secret_hosted')
    vi.stubEnv('ASSISTANT_DB_URL', 'postgresql://hosted')

    const resolved = supabaseServerEnv()

    expect(resolved.url).toBe('https://example.supabase.co')
    expect(resolved.publishableKeys).toEqual({ default: 'sb_publishable_hosted' })
    expect(resolved.secretKeys).toEqual({ default: 'sb_secret_hosted' })
    expect(resolved.jwks).toEqual(
      new URL('https://example.supabase.co/auth/v1/.well-known/jwks.json')
    )
    expect(env.supabaseUrl).toBe('https://example.supabase.co')
    expect(env.supabasePublishableKey).toBe('sb_publishable_hosted')
    expect(env.supabaseSecretKey).toBe('sb_secret_hosted')
    expect(env.supabaseDbUrl).toBe('postgresql://hosted')
  })

  it('reads the platform default SUPABASE_*_KEYS JSON dictionaries', () => {
    clearProjectEnv()
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv(
      'SUPABASE_PUBLISHABLE_KEYS',
      '{"default":"sb_publishable_dict","other":"sb_publishable_2"}'
    )
    vi.stubEnv('SUPABASE_SECRET_KEYS', '{"only":"sb_secret_dict"}')

    const resolved = supabaseServerEnv()

    expect(resolved.publishableKeys).toEqual({
      default: 'sb_publishable_dict',
      other: 'sb_publishable_2',
    })
    expect(resolved.secretKeys).toEqual({ only: 'sb_secret_dict' })
    expect(env.supabasePublishableKey).toBe('sb_publishable_dict')
    expect(env.supabaseSecretKey).toBe('sb_secret_dict')
  })

  it('lets an explicit ASSISTANT_* value override a platform-provided SUPABASE_* one', () => {
    clearProjectEnv()
    vi.stubEnv('SUPABASE_URL', 'https://platform.supabase.co')
    vi.stubEnv('ASSISTANT_SUPABASE_URL', 'https://explicit.supabase.co')
    vi.stubEnv('SUPABASE_DB_URL', 'postgresql://postgres:x@db.ref.supabase.co:5432/postgres')
    vi.stubEnv(
      'ASSISTANT_DB_URL',
      'postgresql://postgres.ref:x@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
    )

    expect(env.supabaseUrl).toBe('https://explicit.supabase.co')
    expect(supabaseServerEnv().url).toBe('https://explicit.supabase.co')
    expect(describeDbHost(env.supabaseDbUrl)).toBe('aws-1-ap-southeast-1.pooler.supabase.com:5432')
  })

  it('prefers a singular key over the dictionary', () => {
    clearProjectEnv()
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_singular')
    vi.stubEnv('SUPABASE_SECRET_KEYS', '{"default":"sb_secret_dict"}')

    expect(env.supabaseSecretKey).toBe('sb_secret_singular')
    expect(supabaseServerEnv().secretKeys).toEqual({ default: 'sb_secret_singular' })
  })

  it('does not throw when worker env is unset', () => {
    clearProjectEnv()

    expect(supabaseServerEnv()).toEqual({})
  })
})

describe('describeDbHost', () => {
  it('returns host and port without credentials', () => {
    expect(
      describeDbHost(
        'postgresql://postgres.ref:s3cret@aws-1-ap-southeast-1.pooler.supabase.green:5432/postgres'
      )
    ).toBe('aws-1-ap-southeast-1.pooler.supabase.green:5432')
  })

  it('does not throw on garbage', () => {
    expect(describeDbHost('not a url')).toBe('<unparseable connection string>')
  })
})

describe('parseApiKeysDictionary', () => {
  it('returns undefined for unset or empty input', () => {
    expect(parseApiKeysDictionary(undefined, 'X')).toBeUndefined()
    expect(parseApiKeysDictionary('{}', 'X')).toBeUndefined()
  })

  it('rejects non-object JSON', () => {
    expect(() => parseApiKeysDictionary('not json', 'X')).toThrow('X must be a JSON object')
    expect(() => parseApiKeysDictionary('["a"]', 'X')).toThrow('X must be a JSON object')
  })
})

function clearProjectEnv() {
  for (const name of [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_DB_URL',
    'DATABASE_URL',
    'SUPABASE_JWKS',
    'SUPABASE_JWKS_URL',
    'SUPABASE_PUBLISHABLE_KEYS',
    'SUPABASE_SECRET_KEYS',
    'ASSISTANT_SUPABASE_URL',
    'ASSISTANT_PUBLISHABLE_KEY',
    'ASSISTANT_SECRET_KEY',
    'ASSISTANT_DB_URL',
    'ASSISTANT_JWKS',
    'ASSISTANT_JWKS_URL',
  ]) {
    vi.stubEnv(name, '')
  }
}

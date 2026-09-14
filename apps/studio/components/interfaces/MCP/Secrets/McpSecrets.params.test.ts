import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildSecretsSignInPath, parseSecretsParams } from './McpSecrets.params'

describe('parseSecretsParams', () => {
  it('reads the project ref and secret name', () => {
    const params = parseSecretsParams({ ref: 'abcdefghijklmnopqrst', name: 'OPENAI_API_KEY' })

    expect(params.ref).toBe('abcdefghijklmnopqrst')
    expect(params.name).toBe('OPENAI_API_KEY')
  })

  it('ignores params it has never seen rather than rejecting them', () => {
    const params = parseSecretsParams({
      ref: 'abcdefghijklmnopqrst',
      name: 'OPENAI_API_KEY',
      somethingMintedLater: 'v2',
    })

    expect(params.ref).toBe('abcdefghijklmnopqrst')
    expect(params.name).toBe('OPENAI_API_KEY')
  })

  it('treats missing params as absent so the page can render as expired', () => {
    expect(parseSecretsParams({})).toMatchObject({ ref: undefined, name: undefined })
  })

  it('rejects a ref that could not be a project ref', () => {
    expect(parseSecretsParams({ ref: '../../etc', name: 'KEY' }).ref).toBeUndefined()
    expect(parseSecretsParams({ ref: '', name: 'KEY' }).ref).toBeUndefined()
  })

  it('keeps the secret name exactly as minted', () => {
    expect(parseSecretsParams({ ref: 'abc', name: 'my.weird-Name_1' }).name).toBe('my.weird-Name_1')
  })

  it('receives the params already decoded and does not decode them again', () => {
    expect(parseSecretsParams({ ref: 'abc', name: 'MY KEY' }).name).toBe('MY KEY')
    expect(parseSecretsParams({ ref: 'abc', name: 'MY%20KEY' }).name).toBe('MY%20KEY')
  })

  it('rejects a blank secret name', () => {
    expect(parseSecretsParams({ ref: 'abc', name: '   ' }).name).toBeUndefined()
    expect(parseSecretsParams({ ref: 'abc', name: '' }).name).toBeUndefined()
  })

  it('mirrors the platform length limit', () => {
    expect(parseSecretsParams({ ref: 'abc', name: 'a'.repeat(256) }).name).toHaveLength(256)
    expect(parseSecretsParams({ ref: 'abc', name: 'a'.repeat(257) }).name).toBeUndefined()
  })

  it('mirrors the platform ban on the SUPABASE_ prefix', () => {
    expect(parseSecretsParams({ ref: 'abc', name: 'SUPABASE_ANON_KEY' }).name).toBeUndefined()
    expect(parseSecretsParams({ ref: 'abc', name: 'MY_SUPABASE_KEY' }).name).toBe('MY_SUPABASE_KEY')
  })

  it('does not let one malformed param take out the other', () => {
    const params = parseSecretsParams({ ref: 'abc', name: 'SUPABASE_ANON_KEY' })

    expect(params.ref).toBe('abc')
    expect(params.name).toBeUndefined()
  })

  it('never surfaces the reserved handle param', () => {
    expect(parseSecretsParams({ ref: 'abc', name: 'KEY', i: 'handle' })).not.toHaveProperty('i')
  })
})

describe('buildSecretsSignInPath', () => {
  it('keeps the elicitation params as siblings of returnTo', () => {
    expect(buildSecretsSignInPath({ ref: 'abc', name: 'OPENAI_API_KEY' })).toBe(
      '/sign-in?returnTo=%2Fmcp%2Fsecrets&ref=abc&name=OPENAI_API_KEY'
    )
  })

  it('percent-encodes names that are not URL-safe', () => {
    expect(buildSecretsSignInPath({ ref: 'abc', name: 'a b&c' })).toBe(
      '/sign-in?returnTo=%2Fmcp%2Fsecrets&ref=abc&name=a+b%26c'
    )
  })

  it('omits params it does not have', () => {
    expect(buildSecretsSignInPath({ ref: undefined, name: undefined })).toBe(
      '/sign-in?returnTo=%2Fmcp%2Fsecrets'
    )
  })
})

describe('the ?state= override', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('is inert unless the build opted in', async () => {
    expect(
      parseSecretsParams({ ref: 'abc', name: 'KEY', state: 'stored' }).dev.state
    ).toBeUndefined()
  })

  it('drives the screen in local and staging builds', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'staging')
    vi.resetModules()

    const { parseSecretsParams: parseWithOverrides } = await import('./McpSecrets.params')

    expect(parseWithOverrides({ ref: 'abc', name: 'KEY', state: 'stored' }).dev.state).toBe(
      'stored'
    )
    expect(
      parseWithOverrides({ ref: 'abc', name: 'KEY', state: 'nonsense' }).dev.state
    ).toBeUndefined()
  })
})

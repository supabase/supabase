import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildElicitationSignInPath, parseElicitationParams } from './McpElicitation.params'

describe('parseElicitationParams', () => {
  it('reads the project ref and secret name', () => {
    const params = parseElicitationParams({ ref: 'abcdefghijklmnopqrst', name: 'OPENAI_API_KEY' })

    expect(params.ref).toBe('abcdefghijklmnopqrst')
    expect(params.name).toBe('OPENAI_API_KEY')
  })

  it('ignores params it has never seen rather than rejecting them', () => {
    const params = parseElicitationParams({
      ref: 'abcdefghijklmnopqrst',
      name: 'OPENAI_API_KEY',
      somethingMintedLater: 'v2',
    })

    expect(params.ref).toBe('abcdefghijklmnopqrst')
    expect(params.name).toBe('OPENAI_API_KEY')
  })

  it('treats missing params as absent so the page can render as expired', () => {
    expect(parseElicitationParams({})).toMatchObject({ ref: undefined, name: undefined })
  })

  it('rejects a ref that could not be a project ref', () => {
    expect(parseElicitationParams({ ref: '../../etc', name: 'KEY' }).ref).toBeUndefined()
    expect(parseElicitationParams({ ref: '', name: 'KEY' }).ref).toBeUndefined()
  })

  it('keeps the secret name exactly as minted', () => {
    expect(parseElicitationParams({ ref: 'abc', name: 'my.weird-Name_1' }).name).toBe(
      'my.weird-Name_1'
    )
  })

  it('rejects a blank secret name', () => {
    expect(parseElicitationParams({ ref: 'abc', name: '   ' }).name).toBeUndefined()
    expect(parseElicitationParams({ ref: 'abc', name: '' }).name).toBeUndefined()
  })

  it('mirrors the platform length limit', () => {
    expect(parseElicitationParams({ ref: 'abc', name: 'a'.repeat(256) }).name).toHaveLength(256)
    expect(parseElicitationParams({ ref: 'abc', name: 'a'.repeat(257) }).name).toBeUndefined()
  })

  it('mirrors the platform ban on the SUPABASE_ prefix', () => {
    expect(parseElicitationParams({ ref: 'abc', name: 'SUPABASE_ANON_KEY' }).name).toBeUndefined()
    expect(parseElicitationParams({ ref: 'abc', name: 'MY_SUPABASE_KEY' }).name).toBe(
      'MY_SUPABASE_KEY'
    )
  })

  it('does not let one malformed param take out the other', () => {
    const params = parseElicitationParams({ ref: 'abc', name: 'SUPABASE_ANON_KEY' })

    expect(params.ref).toBe('abc')
    expect(params.name).toBeUndefined()
  })

  it('never surfaces the reserved handle param', () => {
    // `i` belongs to the stateful handoff (AI-1170) and must stay unread here.
    expect(parseElicitationParams({ ref: 'abc', name: 'KEY', i: 'handle' })).not.toHaveProperty('i')
  })
})

describe('buildElicitationSignInPath', () => {
  it('keeps the elicitation params as siblings of returnTo', () => {
    // `validateReturnTo` restricts the charset of `returnTo` itself, so an
    // embedded query string would be dropped on the way back.
    expect(buildElicitationSignInPath({ ref: 'abc', name: 'OPENAI_API_KEY' })).toBe(
      '/sign-in?returnTo=%2Fmcp_callback&ref=abc&name=OPENAI_API_KEY'
    )
  })

  it('percent-encodes names that are not URL-safe', () => {
    expect(buildElicitationSignInPath({ ref: 'abc', name: 'a b&c' })).toBe(
      '/sign-in?returnTo=%2Fmcp_callback&ref=abc&name=a+b%26c'
    )
  })

  it('omits params it does not have', () => {
    expect(buildElicitationSignInPath({ ref: undefined, name: undefined })).toBe(
      '/sign-in?returnTo=%2Fmcp_callback'
    )
  })
})

describe('the ?state= override', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('is inert unless the build opted in', async () => {
    // Vitest runs with `NODE_ENV=test` and no `NEXT_PUBLIC_ENVIRONMENT`, which is
    // the production shape of the gate. A production bundle must ignore `state`.
    expect(
      parseElicitationParams({ ref: 'abc', name: 'KEY', state: 'stored' }).dev.state
    ).toBeUndefined()
  })

  it('drives the screen in local and staging builds', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'staging')
    vi.resetModules()

    const { parseElicitationParams: parseWithOverrides } = await import('./McpElicitation.params')

    expect(parseWithOverrides({ ref: 'abc', name: 'KEY', state: 'stored' }).dev.state).toBe(
      'stored'
    )
    expect(
      parseWithOverrides({ ref: 'abc', name: 'KEY', state: 'nonsense' }).dev.state
    ).toBeUndefined()
  })
})

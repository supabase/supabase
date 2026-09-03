import { describe, expect, it } from 'vitest'

import { buildElicitationReturnTo, parseElicitationParams } from './McpElicitation.params'

describe('parseElicitationParams', () => {
  it('reads the handoff handle', () => {
    expect(parseElicitationParams({ i: 'abc123' }).handle).toBe('abc123')
  })

  it('ignores params it has never seen rather than rejecting them', () => {
    const params = parseElicitationParams({ i: 'abc123', somethingMintedLater: 'v2' })

    expect(params.handle).toBe('abc123')
  })

  it('treats a missing handle as absent', () => {
    expect(parseElicitationParams({}).handle).toBeUndefined()
  })

  it('treats a blank handle as absent', () => {
    expect(parseElicitationParams({ i: '   ' }).handle).toBeUndefined()
  })

  it('does not let a malformed handle take out the rest of the parse', () => {
    expect(() => parseElicitationParams({ i: '' })).not.toThrow()
    expect(parseElicitationParams({ i: '' }).handle).toBeUndefined()
  })
})

describe('buildElicitationReturnTo', () => {
  it('carries the handle back so a sign-in round trip resumes the same request', () => {
    expect(buildElicitationReturnTo('abc123')).toBe('/mcp_callback?i=abc123')
  })

  it('escapes handles that are not URL-safe', () => {
    expect(buildElicitationReturnTo('a b&c')).toBe('/mcp_callback?i=a+b%26c')
  })

  it('returns a bare path when there is no handle to preserve', () => {
    expect(buildElicitationReturnTo(undefined)).toBe('/mcp_callback')
  })

  it('only ever emits a same-origin relative path', () => {
    expect(buildElicitationReturnTo('//evil.example.com')).toBe(
      '/mcp_callback?i=%2F%2Fevil.example.com'
    )
  })
})

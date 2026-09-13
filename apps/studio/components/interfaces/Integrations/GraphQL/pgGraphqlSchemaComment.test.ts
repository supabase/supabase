import { describe, expect, it } from 'vitest'

import {
  buildSchemaCommentWith,
  isIntrospectionEnabled,
  isPgGraphqlIntrospectionOptIn,
  parseSchemaComment,
} from './pgGraphqlSchemaComment'

describe('parseSchemaComment', () => {
  it('returns no directive for null', () => {
    expect(parseSchemaComment(null)).toEqual({
      options: {},
      hasDirective: false,
      isMalformed: false,
      prefix: '',
      suffix: '',
    })
  })

  it('returns no directive for undefined', () => {
    expect(parseSchemaComment(undefined)).toEqual({
      options: {},
      hasDirective: false,
      isMalformed: false,
      prefix: '',
      suffix: '',
    })
  })

  it('returns no directive for empty string', () => {
    expect(parseSchemaComment('')).toEqual({
      options: {},
      hasDirective: false,
      isMalformed: false,
      prefix: '',
      suffix: '',
    })
  })

  it('parses a directive with no options', () => {
    expect(parseSchemaComment('@graphql({})')).toEqual({
      options: {},
      hasDirective: true,
      isMalformed: false,
      prefix: '',
      suffix: '',
    })
  })

  it('parses a directive with introspection: true', () => {
    expect(parseSchemaComment('@graphql({"introspection": true})')).toMatchObject({
      options: { introspection: true },
      hasDirective: true,
      isMalformed: false,
    })
  })

  it('parses a directive with introspection: false', () => {
    expect(parseSchemaComment('@graphql({"introspection": false})')).toMatchObject({
      options: { introspection: false },
      hasDirective: true,
      isMalformed: false,
    })
  })

  it('parses multiple option keys', () => {
    expect(
      parseSchemaComment(
        '@graphql({"introspection": true, "inflect_names": true, "max_rows": 100})'
      )
    ).toMatchObject({
      options: { introspection: true, inflect_names: true, max_rows: 100 },
      hasDirective: true,
    })
  })

  it('preserves surrounding text', () => {
    const result = parseSchemaComment(
      'a user-written prefix @graphql({"introspection": true}) and a suffix'
    )
    expect(result).toMatchObject({
      options: { introspection: true },
      hasDirective: true,
      prefix: 'a user-written prefix ',
      suffix: ' and a suffix',
    })
  })

  it('treats a comment without a directive as prefix-only', () => {
    expect(parseSchemaComment('Just a plain comment.')).toEqual({
      options: {},
      hasDirective: false,
      isMalformed: false,
      prefix: 'Just a plain comment.',
      suffix: '',
    })
  })

  it('handles whitespace between @graphql and the opening paren', () => {
    expect(parseSchemaComment('@graphql  ({"introspection": true})')).toMatchObject({
      options: { introspection: true },
      hasDirective: true,
    })
  })

  it('handles whitespace inside the directive parens', () => {
    expect(parseSchemaComment('@graphql(  {"introspection": true}  )')).toMatchObject({
      options: { introspection: true },
      hasDirective: true,
    })
  })

  it('handles JSON with nested objects and arrays', () => {
    const comment =
      '@graphql({"introspection": true, "schema": {"nested": {"deep": [1, 2, 3]}, "list": []}})'
    expect(parseSchemaComment(comment)).toMatchObject({
      options: {
        introspection: true,
        schema: { nested: { deep: [1, 2, 3] }, list: [] },
      },
      hasDirective: true,
    })
  })

  it('handles string values containing braces and parens', () => {
    const comment = '@graphql({"label": "value with } { ( ) braces"})'
    expect(parseSchemaComment(comment)).toMatchObject({
      options: { label: 'value with } { ( ) braces' },
      hasDirective: true,
    })
  })

  it('handles escaped quotes inside string values', () => {
    const comment = '@graphql({"label": "she said \\"hi\\""})'
    expect(parseSchemaComment(comment)).toMatchObject({
      options: { label: 'she said "hi"' },
      hasDirective: true,
    })
  })

  it('treats invalid JSON as malformed', () => {
    expect(parseSchemaComment('@graphql({not valid json})')).toMatchObject({
      options: {},
      hasDirective: true,
      isMalformed: true,
    })
  })

  it('treats trailing-comma JSON as malformed', () => {
    expect(parseSchemaComment('@graphql({"introspection": true,})')).toMatchObject({
      options: {},
      hasDirective: true,
      isMalformed: true,
    })
  })

  it('ignores incomplete @graphql with no closing paren', () => {
    expect(parseSchemaComment('@graphql({"introspection": true}')).toEqual({
      options: {},
      hasDirective: false,
      isMalformed: false,
      prefix: '@graphql({"introspection": true}',
      suffix: '',
    })
  })

  it('ignores @graphql followed by something other than {', () => {
    expect(parseSchemaComment('@graphql(true)')).toEqual({
      options: {},
      hasDirective: false,
      isMalformed: false,
      prefix: '@graphql(true)',
      suffix: '',
    })
  })

  it('only matches the first @graphql directive', () => {
    const comment = '@graphql({"introspection": true}) tail @graphql({"max_rows": 5})'
    const result = parseSchemaComment(comment)
    expect(result.options).toEqual({ introspection: true })
    expect(result.hasDirective).toBe(true)
    expect(result.prefix).toBe('')
    expect(result.suffix).toBe(' tail @graphql({"max_rows": 5})')
  })
})

describe('buildSchemaCommentWith', () => {
  it('produces a directive when comment is null', () => {
    expect(buildSchemaCommentWith(null, { introspection: true })).toBe(
      '@graphql({"introspection":true})'
    )
  })

  it('produces a directive when comment is undefined', () => {
    expect(buildSchemaCommentWith(undefined, { introspection: true })).toBe(
      '@graphql({"introspection":true})'
    )
  })

  it('produces a directive when comment is empty', () => {
    expect(buildSchemaCommentWith('', { introspection: true })).toBe(
      '@graphql({"introspection":true})'
    )
  })

  it('appends a directive after existing non-directive text', () => {
    expect(buildSchemaCommentWith('User notes about this schema', { introspection: true })).toBe(
      'User notes about this schema @graphql({"introspection":true})'
    )
  })

  it('avoids double-spacing when existing text already ends in a space', () => {
    expect(buildSchemaCommentWith('User notes ', { introspection: true })).toBe(
      'User notes @graphql({"introspection":true})'
    )
  })

  it('replaces only the directive when one exists, preserving surrounding text', () => {
    expect(
      buildSchemaCommentWith('prefix @graphql({"inflect_names": true}) suffix', {
        introspection: true,
      })
    ).toBe('prefix @graphql({"inflect_names":true,"introspection":true}) suffix')
  })

  it('merges new keys with existing keys', () => {
    expect(
      buildSchemaCommentWith('@graphql({"inflect_names": true, "max_rows": 100})', {
        introspection: true,
      })
    ).toBe('@graphql({"inflect_names":true,"max_rows":100,"introspection":true})')
  })

  it('overrides existing keys with new values', () => {
    expect(
      buildSchemaCommentWith('@graphql({"introspection": false, "max_rows": 100})', {
        introspection: true,
      })
    ).toBe('@graphql({"introspection":true,"max_rows":100})')
  })

  it('preserves nested object values when merging', () => {
    expect(
      buildSchemaCommentWith('@graphql({"schema": {"foo": "bar"}, "max_rows": 100})', {
        introspection: true,
      })
    ).toBe('@graphql({"schema":{"foo":"bar"},"max_rows":100,"introspection":true})')
  })

  it('discards malformed directive content and writes a clean directive', () => {
    expect(
      buildSchemaCommentWith('prefix @graphql({not valid json}) suffix', { introspection: true })
    ).toBe('prefix @graphql({"introspection":true}) suffix')
  })

  it('supports disabling introspection', () => {
    expect(
      buildSchemaCommentWith('@graphql({"introspection": true, "max_rows": 100})', {
        introspection: false,
      })
    ).toBe('@graphql({"introspection":false,"max_rows":100})')
  })
})

describe('isIntrospectionEnabled', () => {
  it('returns true only when introspection is the boolean true', () => {
    expect(isIntrospectionEnabled({ introspection: true })).toBe(true)
  })

  it.each([
    [{}],
    [{ introspection: false }],
    [{ introspection: 'true' }],
    [{ introspection: 1 }],
    [{ introspection: null }],
    [{ other: true }],
  ])('returns false for %j', (options) => {
    expect(isIntrospectionEnabled(options as Record<string, unknown>)).toBe(false)
  })
})

describe('isPgGraphqlIntrospectionOptIn', () => {
  it.each([
    ['1.6.0', true],
    ['1.6.1', true],
    ['1.7.0', true],
    ['2.0.0', true],
    ['1.5.9', false],
    ['1.5.0', false],
    ['1.0.0', false],
    ['0.9.0', false],
  ])('version %s returns %s', (version, expected) => {
    expect(isPgGraphqlIntrospectionOptIn(version)).toBe(expected)
  })

  it('handles versions without patch', () => {
    expect(isPgGraphqlIntrospectionOptIn('1.6')).toBe(true)
    expect(isPgGraphqlIntrospectionOptIn('1.5')).toBe(false)
  })

  it('ignores pre-release / build suffixes', () => {
    expect(isPgGraphqlIntrospectionOptIn('1.6.0-rc.1')).toBe(true)
    expect(isPgGraphqlIntrospectionOptIn('1.5.9-rc.1')).toBe(false)
  })

  it.each([[null], [undefined], [''], ['not-a-version'], ['x.y.z']])(
    'returns false for unparseable input %j',
    (version) => {
      expect(isPgGraphqlIntrospectionOptIn(version)).toBe(false)
    }
  )
})

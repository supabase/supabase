import { describe, expect, it } from 'vitest'

import { parsePartialVariables, substitutePartialVars } from './partials.utils'

describe('substitutePartialVars', () => {
  it('substitutes provided variables', () => {
    const content = 'Here is a partial that takes a {{ .var }}.'
    expect(substitutePartialVars(content, { var: 'string replacement' })).toBe(
      'Here is a partial that takes a string replacement.'
    )
  })

  it('renders unprovided variables as empty strings', () => {
    const content = 'Here is a partial that takes a {{ .var }}.'
    expect(substitutePartialVars(content, undefined)).toBe('Here is a partial that takes a .')
  })

  it('ignores variables that are not referenced in the content', () => {
    const content = 'Here is a partial that takes a {{ .var }}.'
    expect(substitutePartialVars(content, { var: 'correct', extra: 'unused' })).toBe(
      'Here is a partial that takes a correct.'
    )
  })

  it('supports hyphenated variable names', () => {
    const content = 'This partial has {{ .my-var }}, {{ .another_var }}, and {{ .myVar123 }}.'
    expect(
      substitutePartialVars(content, {
        'my-var': 'hyphenated value',
        another_var: 'underscored value',
        myVar123: 'alphanumeric value',
      })
    ).toBe('This partial has hyphenated value, underscored value, and alphanumeric value.')
  })

  it('handles values containing $ replacement patterns literally', () => {
    expect(substitutePartialVars('Hello {{ .name }}', { name: '$& is literal' })).toBe(
      'Hello $& is literal'
    )
  })

  it('handles keys containing regex metacharacters', () => {
    expect(substitutePartialVars('Hello {{ .a.b }}', { 'a.b': 'world' })).toBe('Hello world')
  })
})

describe('parsePartialVariables', () => {
  it('returns undefined when variables are omitted', () => {
    expect(parsePartialVariables(undefined)).toBeUndefined()
  })

  it('parses JSON object strings', () => {
    expect(parsePartialVariables('{ "product": "Auth" }')).toEqual({
      product: 'Auth',
    })
  })

  it('accepts already-parsed objects', () => {
    expect(parsePartialVariables({ product: 'Auth' })).toEqual({
      product: 'Auth',
    })
  })

  it('throws on non-string values', () => {
    expect(() => parsePartialVariables('{ "var": [0, 1, 2] }')).toThrow(/valid JSON/)
  })
})

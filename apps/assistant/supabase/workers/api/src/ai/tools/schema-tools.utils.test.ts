import { describe, expect, test } from 'vitest'

import { asQueryRows, validSchemaNames } from './schema-tools.utils'

describe('validSchemaNames', () => {
  test('keeps postgres identifiers', () => {
    expect(validSchemaNames(['public', 'auth', 'graphql_public'])).toEqual([
      'public',
      'auth',
      'graphql_public',
    ])
  })

  test('drops empty, quoted, and injection-shaped names', () => {
    expect(validSchemaNames(['', 'public;drop', '1bad', '"public"', 'ok'])).toEqual(['ok'])
  })

  test('treats missing schemas as none', () => {
    expect(validSchemaNames(undefined)).toEqual([])
  })
})

describe('asQueryRows', () => {
  test('unwraps management API { result } payloads', () => {
    expect(asQueryRows({ result: [{ name: 'widgets' }] })).toEqual([{ name: 'widgets' }])
  })

  test('accepts a bare row array', () => {
    expect(asQueryRows([{ name: 'widgets' }])).toEqual([{ name: 'widgets' }])
  })

  test('returns empty for unexpected shapes', () => {
    expect(asQueryRows(null)).toEqual([])
    expect(asQueryRows('nope')).toEqual([])
    expect(asQueryRows({ result: 'nope' })).toEqual([])
  })
})

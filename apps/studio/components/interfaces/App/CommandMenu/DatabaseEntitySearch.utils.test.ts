import { describe, expect, test } from 'vitest'

import {
  formatTableSearchDetails,
  getEntitySearchQuery,
  getTableEditorRoute,
} from './DatabaseEntitySearch.utils'

describe('getEntitySearchQuery', () => {
  test('is not searchable below the minimum length', () => {
    expect(getEntitySearchQuery('bl')).toEqual({ query: 'bl', isSearchable: false })
  })

  test('trims whitespace before checking the length', () => {
    expect(getEntitySearchQuery('  bl  ')).toEqual({ query: 'bl', isSearchable: false })
    expect(getEntitySearchQuery(' blog ')).toEqual({ query: 'blog', isSearchable: true })
  })

  test('is not searchable when longer than a Postgres identifier', () => {
    expect(getEntitySearchQuery('a'.repeat(63)).isSearchable).toBe(true)
    expect(getEntitySearchQuery('a'.repeat(64)).isSearchable).toBe(false)
  })
})

describe('formatTableSearchDetails', () => {
  test('pluralizes the policy count', () => {
    expect(formatTableSearchDetails({ policy_count: 0, rls_enabled: false })).toBe(
      '0 policies • RLS disabled'
    )
    expect(formatTableSearchDetails({ policy_count: 1, rls_enabled: true })).toBe(
      '1 policy • RLS enabled'
    )
    expect(formatTableSearchDetails({ policy_count: 4, rls_enabled: true })).toBe(
      '4 policies • RLS enabled'
    )
  })
})

describe('getTableEditorRoute', () => {
  test('links to the table in the table editor', () => {
    expect(getTableEditorRoute('abc', { id: 123, schema: 'public' })).toBe(
      '/project/abc/editor/123?schema=public'
    )
  })

  test('encodes the schema name', () => {
    expect(getTableEditorRoute('abc', { id: 1, schema: 'my schema' })).toBe(
      '/project/abc/editor/1?schema=my%20schema'
    )
  })
})

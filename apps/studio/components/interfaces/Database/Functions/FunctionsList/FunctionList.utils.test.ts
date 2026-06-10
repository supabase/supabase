import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { getDatabaseTriggersHref, useFilteredFunctions } from './FunctionList.utils'
import { DatabaseFunction } from '@/data/database-functions/database-functions-query'

describe('FunctionList.utils: getDatabaseTriggersHref', () => {
  it('builds the triggers href with a plain function name', () => {
    expect(getDatabaseTriggersHref('abc', 'on_insert')).toBe(
      '/project/abc/database/triggers?search=on_insert'
    )
  })

  it('preserves special characters in the function name', () => {
    const href = getDatabaseTriggersHref('abc', 'on_insert&schema=secret')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('on_insert&schema=secret')
    expect(parsed.searchParams.get('schema')).toBeNull()
  })

  it('preserves spaces and plus signs in the function name', () => {
    const href = getDatabaseTriggersHref('abc', 'a name+x')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('a name+x')
  })

  it('falls back to empty strings for undefined inputs', () => {
    expect(getDatabaseTriggersHref(undefined, undefined)).toBe(
      '/project//database/triggers?search='
    )
  })
})

describe('useFilteredFunctions', () => {
  const functions = [
    {
      name: 'select_some_users',
      id: 2,
      definition: `select * from users where name = 'bazinga'`,
      schema: 'public',
      return_type: 'Record',
      security_definer: false,
    },
    {
      name: 'another_function',
      id: 3,
      definition: `select 'test'`,
      schema: 'public',
      return_type: 'uuid',
      security_definer: true,
    },
    {
      name: 'ignore_me',
      id: 4,
      definition: `raise notice 'test'`,
      schema: 'public',
      return_type: 'uuid',
      security_definer: true,
    },
    {
      name: 'select_users',
      id: 5,
      definition: 'select * from users',
      schema: 'public',
      return_type: 'uuid',
      security_definer: true,
    },
    {
      name: 'from_other_schema',
      id: 1,
      definition: 'select * from other.users',
      schema: 'other',
      return_type: 'uuid',
      security_definer: true,
    },
  ]

  it('filters functions by looking at both name and definition, ranking them so that name matches come first', () => {
    const { result } = renderHook(() =>
      useFilteredFunctions({
        // @ts-expect-error more properties are expected for functions but we're only interested in some
        functions,
        filterString: 'select',
        schema: 'public',
      })
    )
    expect(result.current).toHaveLength(3)
    expect(result.current[0].name).toBe('select_users')
    expect(result.current[1].name).toBe('select_some_users')
    expect(result.current[2].name).toBe('another_function')
  })
  it('filters functions correctly by name', () => {
    const { result } = renderHook(() =>
      useFilteredFunctions({
        // @ts-expect-error more properties are expected for functions but we're only interested in some
        functions,
        filterString: 'another_function',
      })
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('another_function')
  })
  it('filters functions correctly by content', () => {
    const { result } = renderHook(() =>
      useFilteredFunctions({
        // @ts-expect-error more properties are expected for functions but we're only interested in some
        functions,
        filterString: 'bazinga',
      })
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('select_some_users')
  })
  it('returns all functions filtered by schema', () => {
    const { result } = renderHook(() =>
      useFilteredFunctions({
        // @ts-expect-error more properties are expected for functions but we're only interested in some
        functions,
        schema: 'other',
      })
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('from_other_schema')
  })
  it('returns all functions filtered by return type', () => {
    const { result } = renderHook(() =>
      useFilteredFunctions({
        // @ts-expect-error more properties are expected for functions but we're only interested in some
        functions,
        returnTypeFilter: ['Record'],
      })
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('select_some_users')
  })
})

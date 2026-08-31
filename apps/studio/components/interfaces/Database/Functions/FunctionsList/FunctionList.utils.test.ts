import { describe, expect, it } from 'vitest'

import { getDatabaseTriggersHref, getFilteredFunctions } from './FunctionList.utils'

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

describe('FunctionList.utils: getFilteredFunctions', () => {
  it('returns all functions when filterString is empty', () => {
    const functions = [
      { name: 'func1', return_type: 'void', security_definer: false, schema: 'public' },
      { name: 'func2', return_type: 'int', security_definer: true, schema: 'public' },
    ]
    const filtered = getFilteredFunctions({
      // @ts-expect-error We don't provide all SavedDatabaseFunction properties
      functions,
      filterString: '',
      returnTypeFilter: [],
      schema: 'public',
      securityFilter: [],
    })
    expect(filtered).toEqual(functions)
  })

  it('filters functions by name when filterString is not empty', () => {
    const functions = [
      { name: 'func_test', return_type: 'void', security_definer: false, schema: 'public' },
      { name: 'another', return_type: 'int', security_definer: true, schema: 'public' },
    ]
    const filtered = getFilteredFunctions({
      // @ts-expect-error We don't provide all SavedDatabaseFunction properties
      functions,
      filterString: 'test',
      returnTypeFilter: [],
      schema: 'public',
      securityFilter: [],
    })
    expect(filtered).toEqual([functions[0]])
  })

  it('filters functions by name or definition when filterString is not empty ranking by name first', () => {
    const functions = [
      {
        name: 'another',
        return_type: 'int',
        security_definer: true,
        schema: 'public',
        definition: "select 'test'",
      },
      {
        name: 'func_test',
        return_type: 'void',
        security_definer: false,
        schema: 'public',
        definition: 'whatever',
      },
      {
        name: 'func2',
        return_type: 'int',
        security_definer: true,
        schema: 'public',
        definition: 'whatever',
      },
    ]
    const filtered = getFilteredFunctions({
      // @ts-expect-error We don't provide all SavedDatabaseFunction properties
      functions,
      filterString: 'test',
      returnTypeFilter: [],
      schema: 'public',
      securityFilter: [],
    })
    expect(filtered).toEqual([functions[1], functions[0]])
  })

  it('filters functions by return type when returnTypeFilter is not empty', () => {
    const functions = [
      { name: 'func1', return_type: 'void', security_definer: false, schema: 'public' },
      { name: 'func2', return_type: 'int', security_definer: true, schema: 'public' },
    ]
    const filtered = getFilteredFunctions({
      // @ts-expect-error We don't provide all SavedDatabaseFunction properties
      functions,
      filterString: '',
      returnTypeFilter: ['int'],
      schema: 'public',
      securityFilter: [],
    })
    expect(filtered).toEqual([functions[1]])
  })

  it('filters functions by security when securityFilter is not empty', () => {
    const functions = [
      { name: 'func1', return_type: 'void', security_definer: false, schema: 'public' },
      { name: 'func2', return_type: 'int', security_definer: true, schema: 'public' },
    ]
    const filtered = getFilteredFunctions({
      // @ts-expect-error We don't provide all SavedDatabaseFunction properties
      functions,
      filterString: '',
      returnTypeFilter: [],
      schema: 'public',
      securityFilter: ['invoker'],
    })
    expect(filtered).toEqual([functions[0]])
  })
})

import { describe, expect, test } from 'vitest'

import { coalesceRowsToArray, filterByList, exceptionIdentifierNotFound } from '../../src/helpers'

describe('pg-meta helpers', () => {
  describe('coalesceRowsToArray', () => {
    test('should generate COALESCE with array_agg for given source and filter', () => {
      const result = coalesceRowsToArray('columns', 'columns.id IS NOT NULL')
      expect(result).toContain('COALESCE')
      expect(result).toContain('array_agg(row_to_json(columns))')
      expect(result).toContain('FILTER (WHERE columns.id IS NOT NULL)')
      expect(result).toContain("'{}'" )
      expect(result).toContain('AS columns')
    })

    test('should use the source name as the alias', () => {
      const result = coalesceRowsToArray('my_table', 'my_table.active = true')
      expect(result).toContain('AS my_table')
      expect(result).toContain('row_to_json(my_table)')
    })
  })

  describe('filterByList', () => {
    test('should return IN clause when include list is provided', () => {
      const result = filterByList(['public', 'custom'])
      expect(result).toContain('IN')
      expect(result).toContain("'public'")
      expect(result).toContain("'custom'")
    })

    test('should return NOT IN clause when exclude list is provided', () => {
      const result = filterByList(undefined, ['pg_catalog', 'information_schema'])
      expect(result).toContain('NOT IN')
      expect(result).toContain("'pg_catalog'")
      expect(result).toContain("'information_schema'")
    })

    test('should prioritize include over exclude', () => {
      const result = filterByList(['public'], ['pg_catalog'])
      expect(result).toContain('IN')
      expect(result).not.toContain('NOT IN')
    })

    test('should return empty string when no lists provided', () => {
      const result = filterByList()
      expect(result).toBe('')
    })

    test('should return empty string with empty arrays', () => {
      const result = filterByList([], [])
      expect(result).toBe('')
    })

    test('should merge defaultExclude with exclude', () => {
      const result = filterByList(undefined, ['custom_exclude'], ['pg_catalog'])
      expect(result).toContain('NOT IN')
      expect(result).toContain("'pg_catalog'")
      expect(result).toContain("'custom_exclude'")
    })

    test('should use defaultExclude alone when no exclude provided', () => {
      const result = filterByList(undefined, undefined, ['pg_catalog'])
      expect(result).toContain('NOT IN')
      expect(result).toContain("'pg_catalog'")
    })
  })

  describe('exceptionIdentifierNotFound', () => {
    test('should generate RAISE EXCEPTION with entity name', () => {
      const result = exceptionIdentifierNotFound('table', 'id = 42')
      expect(result).toContain('raise exception')
      expect(result).toContain('Cannot find table')
      expect(result).toContain("'id = 42'")
    })

    test('should properly escape the where clause', () => {
      const result = exceptionIdentifierNotFound('schema', "name = 'test'")
      expect(result).toContain('raise exception')
      expect(result).toContain('Cannot find schema')
    })
  })
})

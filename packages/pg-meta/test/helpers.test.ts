import { describe, expect, test } from 'vitest'

import { coalesceRowsToArray, exceptionIdentifierNotFound, filterByList } from '../src/helpers'
import { safeSql } from '../src/pg-format'

describe('helpers', () => {
  describe('filterByList', () => {
    test('returns an empty fragment when no include or exclude list is given', () => {
      expect(filterByList()).toBe('')
      expect(filterByList([], [])).toBe('')
    })

    test('builds an IN clause from the include list', () => {
      expect(filterByList(['public', 'auth'])).toBe(`IN ('public','auth')`)
    })

    test('builds a NOT IN clause from the exclude list', () => {
      expect(filterByList(undefined, ['pg_catalog'])).toBe(`NOT IN ('pg_catalog')`)
    })

    test('ignores the exclude list when an include list is given', () => {
      expect(filterByList(['public'], ['pg_catalog'])).toBe(`IN ('public')`)
    })

    test('falls back to the exclude list when the include list is empty', () => {
      expect(filterByList([], ['pg_catalog'])).toBe(`NOT IN ('pg_catalog')`)
    })

    test('prepends defaultExclude to the exclude list', () => {
      expect(filterByList(undefined, ['custom'], ['pg_catalog', 'information_schema'])).toBe(
        `NOT IN ('pg_catalog','information_schema','custom')`
      )
    })

    test('applies defaultExclude when no exclude list is given', () => {
      expect(filterByList(undefined, undefined, ['pg_catalog'])).toBe(`NOT IN ('pg_catalog')`)
    })

    test('does not apply defaultExclude when an include list is given', () => {
      expect(filterByList(['public'], undefined, ['pg_catalog'])).toBe(`IN ('public')`)
    })

    test('escapes single quotes in list values', () => {
      expect(filterByList(["o'brien"])).toBe(`IN ('o''brien')`)
    })
  })

  describe('coalesceRowsToArray', () => {
    test('wraps the source rows in COALESCE and aliases the result', () => {
      const sql = coalesceRowsToArray('columns', safeSql`columns.table_id = tables.id`)

      expect(sql).toContain('COALESCE(')
      expect(sql).toContain(
        `array_agg(row_to_json(columns)) FILTER (WHERE columns.table_id = tables.id)`
      )
      expect(sql).toContain(`'{}'`)
      expect(sql.trimEnd().endsWith('AS columns')).toBe(true)
    })

    test('omits ORDER BY when no orderBy is given', () => {
      const sql = coalesceRowsToArray('columns', safeSql`columns.table_id = tables.id`)

      expect(sql).not.toContain('ORDER BY')
    })

    test('places ORDER BY inside array_agg when orderBy is given', () => {
      const sql = coalesceRowsToArray(
        'columns',
        safeSql`columns.table_id = tables.id`,
        safeSql`columns.name`
      )

      expect(sql).toContain(
        `array_agg(row_to_json(columns) ORDER BY columns.name) FILTER (WHERE columns.table_id = tables.id)`
      )
    })
  })

  describe('exceptionIdentifierNotFound', () => {
    test('raises an exception naming the entity and quoting the where clause as a literal', () => {
      expect(exceptionIdentifierNotFound('widget', 'id = 1')).toBe(
        `raise exception 'Cannot find widget with: %', 'id = 1';`
      )
    })

    test('escapes single quotes in the where clause', () => {
      expect(exceptionIdentifierNotFound('widget', `name = 'x'`)).toBe(
        `raise exception 'Cannot find widget with: %', 'name = ''x''';`
      )
    })
  })
})

import { describe, expect, test } from 'vitest'

import { ident, literal } from '../src/pg-format'

describe('pg-format', () => {
  describe('ident', () => {
    describe('reserved keywords', () => {
      test('should quote "collation" reserved keyword', () => {
        expect(ident('collation')).toBe('"collation"')
        expect(ident('COLLATION')).toBe('"COLLATION"')
        expect(ident('Collation')).toBe('"Collation"')
      })

      test('should quote other reserved keywords', () => {
        expect(ident('select')).toBe('"select"')
        expect(ident('from')).toBe('"from"')
        expect(ident('where')).toBe('"where"')
        expect(ident('order')).toBe('"order"')
        expect(ident('group')).toBe('"group"')
        expect(ident('table')).toBe('"table"')
        expect(ident('column')).toBe('"column"')
        expect(ident('create')).toBe('"create"')
        expect(ident('insert')).toBe('"insert"')
        expect(ident('update')).toBe('"update"')
        expect(ident('delete')).toBe('"delete"')
      })

      test('should not quote non-reserved identifiers', () => {
        expect(ident('normal_column')).toBe('normal_column')
        expect(ident('my_table')).toBe('my_table')
        expect(ident('user_id')).toBe('user_id')
        expect(ident('_private')).toBe('_private')
        expect(ident('col1')).toBe('col1')
      })

      test('should quote identifiers with special characters', () => {
        expect(ident('column with spaces')).toBe('"column with spaces"')
        expect(ident('column-with-dashes')).toBe('"column-with-dashes"')
        expect(ident('column.with.dots')).toBe('"column.with.dots"')
        expect(ident('column$with$dollar')).toBe('column$with$dollar')
      })

      test('should handle double quotes in identifiers', () => {
        expect(ident('quoted"column')).toBe('"quoted""column"')
        expect(ident('"already quoted"')).toBe('"""already quoted"""')
      })

      test('should handle camelCase identifiers', () => {
        expect(ident('camelCaseColumn')).toBe('"camelCaseColumn"')
        expect(ident('PascalCase')).toBe('"PascalCase"')
      })

      test('should handle identifiers starting with numbers', () => {
        expect(ident('123column')).toBe('"123column"')
        expect(ident('1st_column')).toBe('"1st_column"')
      })
    })

    describe('edge cases', () => {
      test('should throw error for null or undefined', () => {
        expect(() => ident(null)).toThrow('SQL identifier cannot be null or undefined')
        expect(() => ident(undefined)).toThrow('SQL identifier cannot be null or undefined')
      })

      test('should handle boolean values', () => {
        expect(ident(true)).toBe('"t"')
        expect(ident(false)).toBe('"f"')
      })

      test('should handle arrays', () => {
        expect(ident(['col1', 'col2'])).toBe('col1,col2')
        expect(ident(['collation', 'select'])).toBe('"collation","select"')
      })

      test('should throw error for nested arrays', () => {
        expect(() => ident([['col1']])).toThrow(
          'Nested array to grouped list conversion is not supported for SQL identifier'
        )
      })

      test('should throw error for objects', () => {
        expect(() => ident({ name: 'test' })).toThrow('SQL identifier cannot be an object')
      })
    })
  })

  describe('literal', () => {
    test('should handle null and undefined', () => {
      expect(literal(null)).toBe('NULL')
      expect(literal(undefined)).toBe('NULL')
    })

    test('should handle strings', () => {
      expect(literal('simple string')).toBe("'simple string'")
      expect(literal("string with 'quotes'")).toBe("'string with ''quotes'''")
      expect(literal('string with "double quotes"')).toBe('\'string with "double quotes"\'')
    })

    test('should handle numbers', () => {
      expect(literal(123)).toBe('123')
      expect(literal(0)).toBe('0')
      expect(literal(-42)).toBe('-42')
      expect(literal(3.14)).toBe('3.14')
    })

    test('should handle booleans', () => {
      expect(literal(true)).toBe("'t'")
      expect(literal(false)).toBe("'f'")
    })

    test('should handle special number values', () => {
      expect(literal(Number.POSITIVE_INFINITY)).toBe("'Infinity'")
      expect(literal(Number.NEGATIVE_INFINITY)).toBe("'-Infinity'")
      expect(literal(Number.NaN)).toBe("'NaN'")
    })

    test('should handle bigint', () => {
      expect(literal(BigInt(123))).toBe('123')
      expect(literal(BigInt('9007199254740991'))).toBe('9007199254740991')
    })

    test('should handle dates', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      expect(literal(date)).toBe("'2024-01-01 00:00:00.000+00'")
    })

    test('should handle arrays', () => {
      expect(literal([1, 2, 3])).toBe('1,2,3')
      expect(literal(['a', 'b', 'c'])).toBe("'a','b','c'")
    })

    test('should handle objects as JSON', () => {
      expect(literal({ name: 'test' })).toBe('\'{"name":"test"}\'::jsonb')
      expect(literal({ id: 1, name: 'test' })).toBe('\'{"id":1,"name":"test"}\'::jsonb')
    })

    test('should handle strings with backslashes', () => {
      expect(literal('path\\to\\file')).toBe("E'path\\\\to\\\\file'")
      expect(literal('C:\\Users\\test')).toBe("E'C:\\\\Users\\\\test'")
    })
  })
})

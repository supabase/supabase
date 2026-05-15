import { describe, expect, expectTypeOf, test } from 'vitest'

import { ident, keyword, literal, safeSql } from '../src/pg-format'

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

  describe('keyword', () => {
    test('accepts single uppercase words', () => {
      expect(keyword('BEFORE')).toBe('BEFORE')
      expect(keyword('AFTER')).toBe('AFTER')
      expect(keyword('ROW')).toBe('ROW')
    })

    test('accepts lowercase and mixed case', () => {
      expect(keyword('instead of')).toBe('instead of')
      expect(keyword('Each Row')).toBe('Each Row')
    })

    test('accepts words with underscores and digits', () => {
      expect(keyword('EACH_ROW')).toBe('EACH_ROW')
      expect(keyword('col2')).toBe('col2')
    })

    test('rejects empty string', () => {
      expect(() => keyword('')).toThrow('Not a valid keyword')
    })

    test('rejects strings starting with a digit', () => {
      expect(() => keyword('1BEFORE')).toThrow('Not a valid keyword')
    })

    test('rejects strings with semicolons', () => {
      expect(() => keyword('BEFORE;')).toThrow('Not a valid keyword')
    })

    test('rejects strings with dashes', () => {
      expect(() => keyword('BE-FORE')).toThrow('Not a valid keyword')
    })

    test('rejects strings with single quotes', () => {
      expect(() => keyword("BE'FORE")).toThrow('Not a valid keyword')
    })

    test('rejects strings with parentheses', () => {
      expect(() => keyword('fn()')).toThrow('Not a valid keyword')
    })
  })

  describe('safeSql', () => {
    test('returns a plain string when there are no interpolations', () => {
      const result = safeSql`SELECT 1`
      expect(result).toBe('SELECT 1')
    })

    test('interpolates ident values', () => {
      const table = ident('my_table')
      const result = safeSql`SELECT * FROM ${table}`
      expect(result).toBe('SELECT * FROM my_table')
    })

    test('interpolates literal values', () => {
      const value = literal('hello')
      const result = safeSql`SELECT ${value}`
      expect(result).toBe("SELECT 'hello'")
    })

    test('interpolates multiple values', () => {
      const table = ident('users')
      const col = ident('email')
      const val = literal('test@example.com')
      const result = safeSql`SELECT ${col} FROM ${table} WHERE ${col} = ${val}`
      expect(result).toBe(`SELECT email FROM users WHERE email = 'test@example.com'`)
    })

    test('handles ident with special characters', () => {
      const table = ident('my "table"')
      const result = safeSql`SELECT * FROM ${table}`
      expect(result).toBe('SELECT * FROM "my ""table"""')
    })

    test('literal: escapes classic quote bypass', () => {
      const val = literal("' OR '1'='1")
      const result = safeSql`SELECT * FROM users WHERE password = ${val}`
      expect(result).toBe("SELECT * FROM users WHERE password = ''' OR ''1''=''1'")
    })

    test('literal: escapes UNION SELECT attack', () => {
      const val = literal("x' UNION SELECT username, password FROM admins --")
      const result = safeSql`SELECT name FROM products WHERE id = ${val}`
      expect(result).toBe(
        "SELECT name FROM products WHERE id = 'x'' UNION SELECT username, password FROM admins --'"
      )
    })

    test('literal: escapes stacked query injection', () => {
      const val = literal("1'; DROP TABLE users; --")
      const result = safeSql`SELECT * FROM users WHERE id = ${val}`
      expect(result).toBe("SELECT * FROM users WHERE id = '1''; DROP TABLE users; --'")
    })

    test('literal: escapes comment-based injection', () => {
      const val = literal("admin'--")
      const result = safeSql`SELECT * FROM users WHERE username = ${val}`
      expect(result).toBe("SELECT * FROM users WHERE username = 'admin''--'")
    })

    test('ident: escapes SQL keyword injection in table name', () => {
      const table = ident('users WHERE 1=1 --')
      const result = safeSql`SELECT * FROM ${table}`
      expect(result).toBe('SELECT * FROM "users WHERE 1=1 --"')
    })

    test('ident: escapes stacked query injection in column name', () => {
      const col = ident('id; DROP TABLE users')
      const result = safeSql`SELECT ${col} FROM users`
      expect(result).toBe('SELECT "id; DROP TABLE users" FROM users')
    })

    test('handles literal with null', () => {
      const val = literal(null)
      const result = safeSql`SELECT ${val}`
      expect(result).toBe('SELECT NULL')
    })

    test('handles literal with numbers', () => {
      const val = literal(42)
      const result = safeSql`SELECT ${val}`
      expect(result).toBe('SELECT 42')
    })

    test('can be nested', () => {
      const col = ident('id')
      const inner = safeSql`SELECT ${col} FROM ${ident('items')}`
      const outer = safeSql`WITH cte AS (${inner}) SELECT * FROM cte`
      expect(outer).toBe('WITH cte AS (SELECT id FROM items) SELECT * FROM cte')
    })
  })

  describe('safeSql type safety', () => {
    test('rejects a plain string interpolation', () => {
      const unsafeValue = 'malicious'
      // @ts-expect-error plain string is not a SafeSqlFragment
      safeSql`SELECT * FROM ${unsafeValue}`
    })

    test('rejects a number interpolation', () => {
      // @ts-expect-error number is not a SafeSqlFragment
      safeSql`SELECT * FROM users LIMIT ${10}`
    })

    test('rejects an object interpolation', () => {
      const obj = { table: 'users' }
      // @ts-expect-error object is not a SafeSqlFragment
      safeSql`SELECT * FROM ${obj}`
    })

    test('accepts SafeSqlFragment from ident', () => {
      const result = safeSql`SELECT * FROM ${ident('users')}`
      expectTypeOf(result).toBeString
    })

    test('accepts SafeSqlFragment from literal', () => {
      const result = safeSql`SELECT ${literal('value')}`
      expectTypeOf(result).toBeString
    })
  })
})

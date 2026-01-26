import { describe, expect, it } from 'vitest'
import { isQuotedInSql, needsQuoting } from './sql-identifier-quoting'

describe('needsQuoting', () => {
  describe('reserved keywords', () => {
    it('returns true for reserved keywords (uppercase)', () => {
      expect(needsQuoting('SELECT')).toBe(true)
      expect(needsQuoting('FROM')).toBe(true)
      expect(needsQuoting('TABLE')).toBe(true)
      expect(needsQuoting('ORDER')).toBe(true)
      expect(needsQuoting('GROUP')).toBe(true)
      expect(needsQuoting('CREATE')).toBe(true)
      expect(needsQuoting('INSERT')).toBe(true)
      expect(needsQuoting('UPDATE')).toBe(true)
      expect(needsQuoting('DELETE')).toBe(true)
    })

    it('returns true for reserved keywords (lowercase)', () => {
      expect(needsQuoting('select')).toBe(true)
      expect(needsQuoting('from')).toBe(true)
      expect(needsQuoting('table')).toBe(true)
      expect(needsQuoting('order')).toBe(true)
    })

    it('returns true for reserved keywords (mixed case)', () => {
      expect(needsQuoting('Select')).toBe(true)
      expect(needsQuoting('From')).toBe(true)
      expect(needsQuoting('Table')).toBe(true)
    })
  })

  describe('mixed case identifiers', () => {
    it('returns true for identifiers with uppercase letters', () => {
      expect(needsQuoting('MyTable')).toBe(true)
      expect(needsQuoting('UserID')).toBe(true)
      expect(needsQuoting('camelCase')).toBe(true)
      expect(needsQuoting('PascalCase')).toBe(true)
    })
  })

  describe('special characters', () => {
    it('returns true for identifiers with dashes', () => {
      expect(needsQuoting('my-table')).toBe(true)
      expect(needsQuoting('user-name')).toBe(true)
    })

    it('returns true for identifiers with dots', () => {
      expect(needsQuoting('table.name')).toBe(true)
      expect(needsQuoting('schema.table')).toBe(true)
    })

    it('returns true for identifiers with spaces', () => {
      expect(needsQuoting('column with spaces')).toBe(true)
      expect(needsQuoting('my table')).toBe(true)
    })

    it('returns true for identifiers starting with numbers', () => {
      expect(needsQuoting('123table')).toBe(true)
      expect(needsQuoting('1col')).toBe(true)
    })
  })

  describe('valid unquoted identifiers', () => {
    it('returns false for lowercase identifiers', () => {
      expect(needsQuoting('users')).toBe(false)
      expect(needsQuoting('user_id')).toBe(false)
      expect(needsQuoting('orders')).toBe(false)
    })

    it('returns false for identifiers starting with underscore', () => {
      expect(needsQuoting('_private')).toBe(false)
      expect(needsQuoting('_internal')).toBe(false)
    })

    it('returns false for identifiers with numbers', () => {
      expect(needsQuoting('col1')).toBe(false)
      expect(needsQuoting('user123')).toBe(false)
    })

    it('returns false for identifiers with dollar sign in middle', () => {
      expect(needsQuoting('col$name')).toBe(false)
    })

    it('returns true for identifiers starting with dollar sign', () => {
      expect(needsQuoting('$variable')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(needsQuoting('')).toBe(true)
    })

    it('handles single character identifiers', () => {
      expect(needsQuoting('a')).toBe(false)
      expect(needsQuoting('A')).toBe(true)
      expect(needsQuoting('_')).toBe(false)
    })
  })
})

describe('isQuotedInSql', () => {
  describe('simple quoted identifiers', () => {
    it('returns true when identifier is quoted', () => {
      expect(isQuotedInSql('SELECT * FROM "MyTable"', 'MyTable')).toBe(true)
      expect(isQuotedInSql('SELECT "MyColumn" FROM users', 'MyColumn')).toBe(true)
      expect(isQuotedInSql('INSERT INTO "users" VALUES (1)', 'users')).toBe(true)
    })

    it('returns false when identifier is not quoted', () => {
      expect(isQuotedInSql('SELECT * FROM users', 'users')).toBe(false)
      expect(isQuotedInSql('SELECT id FROM orders', 'id')).toBe(false)
      expect(isQuotedInSql('INSERT INTO users VALUES (1)', 'users')).toBe(false)
    })
  })

  describe('case-insensitive matching', () => {
    it('matches quoted identifier regardless of case', () => {
      expect(isQuotedInSql('SELECT * FROM "mytable"', 'MyTable')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM "MYTABLE"', 'mytable')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM "MyTable"', 'MYTABLE')).toBe(true)
    })
  })

  describe('escaped quotes', () => {
    it('handles identifiers with escaped quotes inside', () => {
      expect(isQuotedInSql('SELECT * FROM "My""Table"', 'My"Table')).toBe(true)
      expect(isQuotedInSql('SELECT "col""name" FROM users', 'col"name')).toBe(true)
    })

    it('handles multiple escaped quotes', () => {
      expect(isQuotedInSql('SELECT "a""b""c" FROM users', 'a"b"c')).toBe(true)
    })
  })

  describe('special regex characters', () => {
    it('handles identifiers with dots', () => {
      expect(isQuotedInSql('SELECT * FROM "table.name"', 'table.name')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM "schema.table"', 'schema.table')).toBe(true)
    })

    it('handles identifiers with parentheses', () => {
      expect(isQuotedInSql('SELECT * FROM "col(value)"', 'col(value)')).toBe(true)
    })

    it('handles identifiers with brackets', () => {
      expect(isQuotedInSql('SELECT * FROM "table[0]"', 'table[0]')).toBe(true)
    })

    it('handles identifiers with special regex chars', () => {
      expect(isQuotedInSql('SELECT * FROM "col*name"', 'col*name')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM "col+name"', 'col+name')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM "col?name"', 'col?name')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM "col^name"', 'col^name')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM "col$name"', 'col$name')).toBe(true)
    })
  })

  describe('multiple occurrences', () => {
    it('returns true if identifier appears quoted anywhere', () => {
      expect(isQuotedInSql('SELECT * FROM "MyTable" WHERE id = 1', 'MyTable')).toBe(true)
      expect(isQuotedInSql('SELECT users.id FROM "users"', 'users')).toBe(true)
    })

    it('returns true even if also appears unquoted', () => {
      expect(isQuotedInSql('SELECT * FROM "MyTable" JOIN MyTable ON 1=1', 'MyTable')).toBe(true)
    })
  })

  describe('partial matches', () => {
    it('does not match partial identifiers', () => {
      expect(isQuotedInSql('SELECT * FROM "MyTableX"', 'MyTable')).toBe(false)
      expect(isQuotedInSql('SELECT * FROM "XMyTable"', 'MyTable')).toBe(false)
    })

    it('matches exact identifier only', () => {
      expect(isQuotedInSql('SELECT * FROM "MyTable"', 'MyTable')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM "MyTable"', 'Table')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles empty identifier', () => {
      expect(isQuotedInSql('SELECT * FROM ""', '')).toBe(true)
      expect(isQuotedInSql('SELECT * FROM users', '')).toBe(false)
    })

    it('handles SQL with comments', () => {
      expect(isQuotedInSql('SELECT * FROM "MyTable" -- comment', 'MyTable')).toBe(true)
      expect(isQuotedInSql('/* comment */ SELECT * FROM "MyTable"', 'MyTable')).toBe(true)
    })

    it('handles SQL with string literals', () => {
      expect(isQuotedInSql('SELECT * FROM "MyTable" WHERE name = \'test\'', 'MyTable')).toBe(true)
      expect(
        isQuotedInSql('SELECT "MyTable" FROM users WHERE name = "not a table"', 'MyTable')
      ).toBe(true)
    })
  })
})

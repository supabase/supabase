import { describe, expect, it } from 'vitest'
import { VALID_FILTER_OPERATORS, selectQuery, countQuery, deleteQuery } from './Query.utils'
import type { Filter } from './types'

describe('VALID_FILTER_OPERATORS', () => {
  it('contains all 12 expected operators', () => {
    const expected = ['=', '<>', '>', '<', '>=', '<=', '~~', '~~*', '!~~', '!~~*', 'in', 'is']
    for (const op of expected) {
      expect(VALID_FILTER_OPERATORS.has(op)).toBe(true)
    }
    expect(VALID_FILTER_OPERATORS.size).toBe(12)
  })

  it('does not contain empty string', () => {
    expect(VALID_FILTER_OPERATORS.has('')).toBe(false)
  })

  it('does not contain SQL comment injection', () => {
    expect(VALID_FILTER_OPERATORS.has('-- comment')).toBe(false)
  })

  it('does not contain semicolon injection', () => {
    expect(VALID_FILTER_OPERATORS.has('; DROP TABLE users; --')).toBe(false)
  })

  it('does not contain newline injection', () => {
    expect(VALID_FILTER_OPERATORS.has('\n')).toBe(false)
  })

  it('does not contain arbitrary strings', () => {
    expect(VALID_FILTER_OPERATORS.has('DROP TABLE')).toBe(false)
    expect(VALID_FILTER_OPERATORS.has('LIKE')).toBe(false)
    expect(VALID_FILTER_OPERATORS.has("'")).toBe(false)
  })
})

describe('selectQuery with filters', () => {
  const table = { schema: 'public', name: 'users' }

  it('builds correct SQL for = operator', () => {
    const filter: Filter = { column: 'id', operator: '=', value: '1' }
    const sql = selectQuery(table, undefined, { filters: [filter] })
    expect(sql).toContain('where')
    expect(sql).toContain('id')
    expect(sql).toContain('=')
  })

  it('builds correct SQL for in operator', () => {
    const filter: Filter = { column: 'status', operator: 'in', value: 'active,pending' }
    const sql = selectQuery(table, undefined, { filters: [filter] })
    expect(sql).toContain('in')
    expect(sql).toContain("'active'")
    expect(sql).toContain("'pending'")
  })

  it('builds correct SQL for is operator with null', () => {
    const filter: Filter = { column: 'deleted_at', operator: 'is', value: 'null' }
    const sql = selectQuery(table, undefined, { filters: [filter] })
    expect(sql).toContain('is')
    expect(sql).toContain('null')
  })

  it('builds correct SQL for LIKE operators (~~)', () => {
    const filter: Filter = { column: 'name', operator: '~~', value: '%alice%' }
    const sql = selectQuery(table, undefined, { filters: [filter] })
    expect(sql).toContain('::text')
    expect(sql).toContain('~~')
  })

  it('throws for invalid operator in default branch', () => {
    // Force an invalid operator past TypeScript — simulates AI/external input
    const filter = { column: 'id', operator: 'DROP TABLE users; --', value: '1' } as unknown as Filter
    expect(() => selectQuery(table, undefined, { filters: [filter] })).toThrow(
      'Invalid SQL filter operator'
    )
  })

  it('throws for SQL comment injection in operator', () => {
    const filter = { column: 'id', operator: '-- injected', value: '1' } as unknown as Filter
    expect(() => selectQuery(table, undefined, { filters: [filter] })).toThrow(
      'Invalid SQL filter operator'
    )
  })

  it('throws for semicolon injection in operator', () => {
    const filter = { column: 'id', operator: '; DELETE FROM users', value: '1' } as unknown as Filter
    expect(() => selectQuery(table, undefined, { filters: [filter] })).toThrow(
      'Invalid SQL filter operator'
    )
  })

  it('throws for empty string operator', () => {
    const filter = { column: 'id', operator: '' as any, value: '1' }
    expect(() => selectQuery(table, undefined, { filters: [filter] })).toThrow(
      'Invalid SQL filter operator'
    )
  })

  it('correctly escapes table/schema identifiers with special chars', () => {
    const specialTable = { schema: 'my schema', name: 'user"table' }
    const sql = selectQuery(specialTable)
    expect(sql).toContain('"my schema"')
    expect(sql).toContain('"user""table"')
  })

  it('correctly escapes column identifiers in filters', () => {
    const filter: Filter = { column: 'user name', operator: '=', value: 'test' }
    const sql = selectQuery(table, undefined, { filters: [filter] })
    expect(sql).toContain('"user name"')
  })
})

describe('countQuery with invalid operator', () => {
  it('throws for injection attempt in operator', () => {
    const filter = { column: 'id', operator: "' OR '1'='1", value: '1' } as unknown as Filter
    expect(() => countQuery({ schema: 'public', name: 'users' }, { filters: [filter] })).toThrow(
      'Invalid SQL filter operator'
    )
  })
})

describe('deleteQuery', () => {
  it('throws for injection in delete filter operator', () => {
    const filter = { column: 'id', operator: 'UNION SELECT', value: '1' } as unknown as Filter
    expect(() =>
      deleteQuery({ schema: 'public', name: 'users' }, [filter])
    ).toThrow('Invalid SQL filter operator')
  })
})

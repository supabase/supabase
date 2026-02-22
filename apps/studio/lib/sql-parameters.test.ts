import { describe, it, expect } from 'vitest'
import { parseParameters, processParameterizedSql } from './sql-parameters'

describe('parseParameters', () => {
  it('parses simple :param without @set', () => {
    const result = parseParameters('SELECT * FROM table WHERE id = :userId')
    expect(result).toEqual([
      {
        name: 'userId',
        value: '',
        defaultValue: undefined,
        type: undefined,
        possibleValues: undefined,
        occurrences: 1,
      },
    ])
  })

  it('parses @set with type and value', () => {
    const result = parseParameters('@set userId:int = 123\nSELECT * FROM table WHERE id = :userId')

    const userIdParam = result.find((p) => p.name === 'userId')
    expect(userIdParam?.defaultValue).toBe('123')
    expect(userIdParam?.type).toBe('int')
  })

  it('parses union type', () => {
    const result = parseParameters(
      '@set status:open|closed = open\nSELECT * FROM users WHERE status = :status'
    )

    const statusParam = result.find((p) => p.name === 'status')
    expect(statusParam?.type).toBe('enum')
    expect(statusParam?.possibleValues).toEqual(['open', 'closed'])
  })

  it('counts multiple occurrences', () => {
    const result = parseParameters('SELECT * FROM table WHERE id = :userId OR owner_id = :userId')

    const userIdParam = result.find((p) => p.name === 'userId')
    expect(userIdParam?.occurrences).toBe(2)
  })

  it('ignores casts and placeholders inside quoted/commented SQL', () => {
    const result = parseParameters(`
      -- :ignored_comment
      SELECT
        metadata::jsonb AS payload,
        ':ignored_string' AS literal
      FROM logs
      WHERE user_id = :userId
      /* :ignored_block_comment */
    `)

    expect(result).toEqual([
      {
        name: 'userId',
        value: '',
        defaultValue: undefined,
        type: undefined,
        possibleValues: undefined,
        occurrences: 1,
      },
    ])
  })

  it('ignores placeholders inside dollar-quoted strings', () => {
    const result = parseParameters(`
      SELECT $$:ignored$$ AS body, :userId AS user_id
    `)

    const userIdParam = result.find((p) => p.name === 'userId')
    expect(userIdParam?.occurrences).toBe(1)
    expect(result.map((p) => p.name)).not.toContain('ignored')
  })
})

describe('processParameterizedSql', () => {
  it('replaces :param with value from parameters', () => {
    const sql = 'SELECT * FROM users WHERE id = :userId'
    const result = processParameterizedSql(sql, { userId: '42' })
    expect(result).toBe('SELECT * FROM users WHERE id = 42')
  })

  it('uses default from @set if param not provided', () => {
    const sql = '@set userId:int = 123\nSELECT * FROM users WHERE id = :userId'
    const result = processParameterizedSql(sql, {})
    expect(result).toBe('SELECT * FROM users WHERE id = 123')
  })

  it('overrides @set default if param is provided', () => {
    const sql = '@set userId:int = 123\nSELECT * FROM users WHERE id = :userId'
    const result = processParameterizedSql(sql, { userId: '999' })
    expect(result).toBe('SELECT * FROM users WHERE id = 999')
  })

  it('throws if no param value is provided and no default exists', () => {
    const sql = 'SELECT * FROM users WHERE id = :userId'
    expect(() => processParameterizedSql(sql, {})).toThrowError(
      'Missing value for parameter: userId'
    )
  })

  it('removes @set lines from final SQL', () => {
    const sql = '@set status:open|closed = open\nSELECT * FROM items WHERE status = :status'
    const result = processParameterizedSql(sql, {})
    expect(result).toBe('SELECT * FROM items WHERE status = open')
    expect(result).not.toContain('@set')
  })

  it('does not treat postgres casts or quoted/commented values as parameters', () => {
    const sql = `
      @set userId:int = 123
      SELECT
        metadata::jsonb AS payload,
        ':ignored_string' AS literal
      FROM logs
      WHERE user_id = :userId
      -- :ignored_comment
      /* :ignored_block_comment */
    `

    const result = processParameterizedSql(sql, {})

    expect(result).toContain('metadata::jsonb')
    expect(result).toContain("':ignored_string' AS literal")
    expect(result).toContain('WHERE user_id = 123')
    expect(result).not.toContain('@set')
  })

  it('throws only for true missing placeholders when casts are present', () => {
    const sql = 'SELECT 1::int, :userId'
    expect(() => processParameterizedSql(sql, {})).toThrowError(
      'Missing value for parameter: userId'
    )
  })
})

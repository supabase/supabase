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
})

describe('SQL Injection Protection', () => {
  it('prevents SQL injection via single quote escape', () => {
    const sql = "@set name = John\nSELECT * FROM users WHERE name = : name"
    const result = processParameterizedSql(sql, { name: "'; DROP TABLE users; --" })
    
    // Should escape the single quotes and treat as literal string
    expect(result).toContain("''; DROP TABLE users; --'")
    expect(result).not.toContain("DROP TABLE users")
  })

  it('prevents SQL injection via UNION attack', () => {
    const sql = "@set userId: int = 1\nSELECT * FROM users WHERE id = :userId"
    const result = processParameterizedSql(sql, { 
      userId: "1 UNION SELECT password FROM admin_users" 
    })
    
    // Should treat entire input as a literal string
    expect(result).toContain("'1 UNION SELECT password FROM admin_users'")
  })

  it('prevents SQL injection via OR 1=1', () => {
    const sql = "@set email = user@example.com\nSELECT * FROM users WHERE email = :email"
    const result = processParameterizedSql(sql, { 
      email: "' OR '1'='1" 
    })
    
    // Should escape and quote properly
    expect(result).toContain("''' OR ''1''=''1'")
  })

  it('prevents SQL injection via comment injection', () => {
    const sql = "@set status = active\nUPDATE users SET status = : status WHERE id = 1"
    const result = processParameterizedSql(sql, { 
      status: "active'; DELETE FROM users; --" 
    })
    
    // Should escape the entire malicious payload
    expect(result).toContain("''")
    expect(result).not.toMatch(/DELETE FROM users; --$/)
  })

  it('prevents SQL injection via semicolon statement termination', () => {
    const sql = "@set name = test\nINSERT INTO logs (name) VALUES (:name)"
    const result = processParameterizedSql(sql, { 
      name: "test'); DROP TABLE logs; --" 
    })
    
    // Should properly escape the value
    expect(result).toContain("'test''); DROP TABLE logs; --'")
  })

  it('handles numeric SQL injection attempts', () => {
    const sql = "@set id: int = 1\nSELECT * FROM users WHERE id = :id"
    const result = processParameterizedSql(sql, { 
      id: "1 OR 1=1" 
    })
    
    // Should treat as string literal
    expect(result).toContain("'1 OR 1=1'")
  })

  it('prevents batch statement injection', () => {
    const sql = "@set query = test\nSELECT * FROM items WHERE name = :query"
    const result = processParameterizedSql(sql, { 
      query: "test'; GRANT ALL ON DATABASE mydb TO attacker; --" 
    })
    
    // Should escape properly
    expect(result).not.toContain("GRANT ALL")
  })
})

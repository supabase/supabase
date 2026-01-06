import { describe, it, expect } from 'vitest'
import { enrichLintsQuery } from './lints'

describe('enrichLintsQuery', () => {
  it('should add schema setting when exposedSchemas is provided', () => {
    const query = 'SELECT * FROM test'
    const exposedSchemas = 'public,app'

    const result = enrichLintsQuery(query, exposedSchemas)

    expect(result).toContain("set local pgrst.db_schemas = 'public,app'")
    expect(result).toContain(query)
  })

  it('should not add schema setting when exposedSchemas is not provided', () => {
    const query = 'SELECT * FROM test'

    const result = enrichLintsQuery(query)

    expect(result).not.toContain('pgrst.db_schemas')
    expect(result).toContain(query)
  })

  it('should include pg_stat_statements.track setting', () => {
    const query = 'SELECT * FROM test'

    const result = enrichLintsQuery(query)

    expect(result).toContain('set pg_stat_statements.track = none')
  })

  it('should include source comment', () => {
    const query = 'SELECT * FROM test'

    const result = enrichLintsQuery(query)

    expect(result).toContain('-- source: dashboard')
  })

  it('should include user comment', () => {
    const query = 'SELECT * FROM test'

    const result = enrichLintsQuery(query)

    expect(result).toContain('-- user: self host')
  })

  it('should include date comment with ISO timestamp', () => {
    const query = 'SELECT * FROM test'
    const before = new Date().toISOString()

    const result = enrichLintsQuery(query)
    const after = new Date().toISOString()

    expect(result).toMatch(/-- date: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    const dateMatch = result.match(/-- date: (.+)/)
    if (dateMatch) {
      const date = new Date(dateMatch[1])
      expect(date.getTime()).toBeGreaterThanOrEqual(new Date(before).getTime())
      expect(date.getTime()).toBeLessThanOrEqual(new Date(after).getTime())
    }
  })
})


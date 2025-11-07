import { describe, expect, it } from 'vitest'
import { formatSql } from './formatSql'

describe('formatSql', () => {
  it('should format SQL', () => {
    const result = formatSql('SELECT * FROM users')

    expect(result).toBe(`select
  *
from
  users`)
  })

  it('should return the original argument if it is not valid, not throw', () => {
    const result = formatSql('123')
    expect(result).toBe('123')
  })

  it('should return the original argument if it is not valid, not throw', () => {
    const result = formatSql('select {col1}, {col2} from {tableName};')
    expect(result).toBe('select {col1}, {col2} from {tableName};')
  })
})

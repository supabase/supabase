import { formatSql } from './formatSql'
import { describe, it, expect } from 'vitest'

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
})

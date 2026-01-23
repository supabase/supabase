import { describe, it, expect } from 'vitest'

import { parseCustomSQL } from './parseCustomSQL'

const baseRange = {
  timerange_from: '2025-01-01T00:00:00Z',
  timerange_to: '2025-01-02T00:00:00Z',
}

describe('parseCustomSQL', () => {
  it('replaces timerange placeholders with quoted ISO datetimes', () => {
    const sql =
      'select * from events where created_at >= @timerange_from and created_at < @timerange_to'
    const parsed = parseCustomSQL(sql, baseRange)

    expect(parsed).toBe(
      "select * from events where created_at >= '2025-01-01T00:00:00Z' and created_at < '2025-01-02T00:00:00Z'"
    )
  })

  it('leaves placeholders untouched when variables are missing', () => {
    const sql = 'select * from events where created_at >= @timerange_from'
    const parsed = parseCustomSQL(sql, { timerange_to: baseRange.timerange_to })

    expect(parsed).toBe(sql)
  })

  it('replaces multiple occurrences', () => {
    const sql =
      'select @timerange_from as start_range, @timerange_to as end_range, count(*) from events where created_at between @timerange_from and @timerange_to group by 1,2'
    const parsed = parseCustomSQL(sql, baseRange)

    expect(parsed).toBe(
      "select '2025-01-01T00:00:00Z' as start_range, '2025-01-02T00:00:00Z' as end_range, count(*) from events where created_at between '2025-01-01T00:00:00Z' and '2025-01-02T00:00:00Z' group by 1,2"
    )
  })

  it('matches placeholders case-insensitively', () => {
    const sql = 'select * from events where created_at >= @TIMERANGE_FROM'
    const parsed = parseCustomSQL(sql, baseRange)

    expect(parsed).toBe(
      "select * from events where created_at >= '2025-01-01T00:00:00Z'"
    )
  })

  it('escapes single quotes inside values', () => {
    const sql = 'select * from events where tag = @timerange_from'
    const parsed = parseCustomSQL(sql, { timerange_from: "2025-01-01T00:00:00Z'" })

    expect(parsed).toBe("select * from events where tag = '2025-01-01T00:00:00Z'''")
  })
})


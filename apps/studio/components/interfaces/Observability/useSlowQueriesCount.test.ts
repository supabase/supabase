import { describe, expect, it } from 'vitest'

import { buildSlowQueriesCountSql } from './useSlowQueriesCount'

describe('buildSlowQueriesCountSql', () => {
  it('guards on the pg_stat_statements extension and returns 0 when it is missing', () => {
    const sql = buildSlowQueriesCountSql()
    expect(sql).toContain('pg_extension')
    expect(sql).toContain("extname = 'pg_stat_statements'")
    expect(sql).toContain('ELSE 0')
  })

  it('counts queries slower than 1s from pg_stat_statements', () => {
    expect(buildSlowQueriesCountSql()).toContain('total_exec_time + total_plan_time > 1000')
  })
})

import { describe, expect, it } from 'vitest'

import { buildSlowQueriesCountSql } from './useSlowQueriesCount'

describe('buildSlowQueriesCountSql', () => {
  it('checks pg_extension before querying pg_stat_statements', () => {
    const sql = buildSlowQueriesCountSql()
    expect(sql).toContain('pg_extension')
    expect(sql).toContain("extname = 'pg_stat_statements'")
  })

  it('returns 0 when extension is not installed', () => {
    expect(buildSlowQueriesCountSql()).toContain('ELSE 0')
  })

  it('still queries pg_stat_statements when extension exists', () => {
    const sql = buildSlowQueriesCountSql()
    expect(sql).toContain('pg_stat_statements')
    expect(sql).toContain('total_exec_time + total_plan_time > 1000')
  })
})

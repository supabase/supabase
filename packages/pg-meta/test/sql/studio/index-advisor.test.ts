import { describe, expect, it } from 'vitest'

import { getTableIndexAdvisorSql } from '../../../src/sql/studio/advisor/index-advisor'

describe('getTableIndexAdvisorSql', () => {
  it('includes schema and table in table-matching regex patterns', () => {
    const sql = getTableIndexAdvisorSql('public', 'orders')

    expect(sql).toContain('index_advisor')
    expect(sql).toContain('pg_stat_statements')
    expect(sql).toContain('(^|[^a-z0-9_$])public[.]orders($|[^a-z0-9_$])')
    expect(sql).toContain('(^|[^a-z0-9_$])from[[:space:]]+orders($|[^a-z0-9_$])')
    expect(sql).toContain('(^|[^a-z0-9_$])join[[:space:]]+orders($|[^a-z0-9_$])')
  })

  it('escapes regex metacharacters in schema and table names', () => {
    const sql = getTableIndexAdvisorSql('my.schema', 'orders+items')

    expect(sql).toContain('my\\\\.schema')
    expect(sql).toContain('orders\\\\+items')
  })

  it('limits analysis to top 5 queries', () => {
    const sql = getTableIndexAdvisorSql('public', 'users')

    expect(sql).toContain('limit 5')
  })
})

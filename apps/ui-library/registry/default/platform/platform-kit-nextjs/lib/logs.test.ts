import { describe, expect, it } from 'vitest'

import { genDefaultQuery, LogsTableName } from './logs'

describe('genDefaultQuery', () => {
  it.each(Object.values(LogsTableName))('queries the unified logs table for %s', (table) => {
    const query = genDefaultQuery(table)
    const source = table === LogsTableName.PG_CRON ? LogsTableName.POSTGRES : table

    expect(query).toContain('from logs')
    expect(query).toContain(`where source = '${source}'`)
    expect(query).toContain('order by timestamp desc')
    expect(query).toContain('limit 100')
    expect(query).not.toContain('cross join unnest')
  })

  it('reads nested edge fields from log_attributes', () => {
    const query = genDefaultQuery(LogsTableName.EDGE)

    expect(query).toContain("log_attributes['request.path'] as path")
    expect(query).toContain("log_attributes['response.status_code'] as status_code")
  })

  it('selects pg_cron logs from the postgres source', () => {
    const query = genDefaultQuery(LogsTableName.PG_CRON)

    expect(query).toContain("log_attributes['parsed.application_name'] = 'pg_cron'")
    expect(query).toContain("log_attributes['parsed.query'] as query")
  })
})

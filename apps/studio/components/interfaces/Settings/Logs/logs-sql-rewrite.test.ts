import { describe, expect, it } from 'vitest'

import { rewriteBqLogsSqlToClickhouse } from './logs-sql-rewrite'

const collapse = (sql: string) => sql.replace(/\s+/g, ' ').trim()

describe('rewriteBqLogsSqlToClickhouse', () => {
  it('rewrites an edge_logs query onto the OTEL logs schema', async () => {
    const { sql, changed } =
      await rewriteBqLogsSqlToClickhouse(`select id, request.method, response.status_code
from edge_logs
cross join unnest(metadata) as m
cross join unnest(m.request) as request
cross join unnest(m.response) as response
where response.status_code >= 500 and request.method = 'POST'
order by edge_logs.timestamp desc
limit 100`)
    const out = collapse(sql)
    expect(changed).toBe(true)
    expect(out).toContain('FROM logs')
    expect(out).toContain("source = 'edge_logs'")
    // unnest joins folded into map access
    expect(out.toLowerCase()).not.toContain('unnest')
    expect(out.toLowerCase()).not.toContain('arrayjoin')
    // column refs rewritten, alias preserved
    expect(out).toContain("log_attributes['request.method'] AS method")
    expect(out).toContain("log_attributes['response.status_code']")
    // numeric field cast for the comparison
    expect(out).toContain("toInt32OrZero(log_attributes['response.status_code']) >= 500")
    // string field not cast
    expect(out).toContain("log_attributes['request.method'] = 'POST'")
  })

  it('rewrites postgres severity columns', async () => {
    const { sql, changed } = await rewriteBqLogsSqlToClickhouse(`select id, parsed.error_severity
from postgres_logs
cross join unnest(metadata) as m
cross join unnest(m.parsed) as parsed`)
    expect(changed).toBe(true)
    expect(collapse(sql)).toContain("source = 'postgres_logs'")
    expect(collapse(sql)).toContain("log_attributes['parsed.error_severity']")
  })

  it('leaves a query with no legacy log table unchanged', async () => {
    const { sql, changed } = await rewriteBqLogsSqlToClickhouse('select 1')
    expect(changed).toBe(false)
    expect(sql).toBe('select 1')
  })
})

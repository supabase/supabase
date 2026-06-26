import { describe, expect, it } from 'vitest'

import { buildClickhouseRewritePrompt, rewriteBqLogsSqlToClickhouse } from './logs-sql-rewrite'

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
    // column refs rewritten, alias preserved (polyglot emits lowercase `as`)
    expect(out).toContain("log_attributes['request.method'] as method")
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

  it('bails on a non-unnest join so the AI fallback handles it', async () => {
    const input = 'select a.event_message from edge_logs a join postgres_logs b on a.id = b.id'
    const { sql, changed } = await rewriteBqLogsSqlToClickhouse(input)
    expect(changed).toBe(false)
    expect(sql).toBe(input)
  })

  it('rewrites a log table query that has no joins', async () => {
    const { sql, changed } = await rewriteBqLogsSqlToClickhouse(
      'select event_message from auth_logs limit 10'
    )
    expect(changed).toBe(true)
    const out = collapse(sql)
    expect(out).toContain('FROM logs')
    expect(out).toContain("source = 'auth_logs'")
  })

  it('strips the table prefix from source-qualified columns in the SELECT list', async () => {
    const { sql, changed } = await rewriteBqLogsSqlToClickhouse(
      'select edge_logs.id, edge_logs.timestamp from edge_logs'
    )
    expect(changed).toBe(true)
    const out = collapse(sql)
    expect(out).toContain("source = 'edge_logs'")
    expect(out).not.toContain('edge_logs.id')
    expect(out).not.toContain('edge_logs.timestamp')
  })

  it('casts numeric metadata fields other than status_code (status) and folds the root alias', async () => {
    const { sql } = await rewriteBqLogsSqlToClickhouse(
      `select id from auth_logs cross join unnest(metadata) as m where m.status >= 400`
    )
    expect(collapse(sql)).toContain("toInt32OrZero(log_attributes['status']) >= 400")
  })

  it('rewrites columns in group by and aggregations', async () => {
    const { sql, changed } = await rewriteBqLogsSqlToClickhouse(
      `select request.method, count(*) as c
from edge_logs
cross join unnest(metadata) as m
cross join unnest(m.request) as request
group by request.method`
    )
    expect(changed).toBe(true)
    const out = collapse(sql)
    expect(out).toContain("log_attributes['request.method']")
    expect(out.toLowerCase()).toContain('group by')
  })

  it('throws on a query it cannot parse', async () => {
    await expect(rewriteBqLogsSqlToClickhouse('!! not valid sql @@')).rejects.toThrow()
  })
})

describe('buildClickhouseRewritePrompt', () => {
  it('embeds the query in a fenced block when SQL is provided', () => {
    const prompt = buildClickhouseRewritePrompt('select count(*) from edge_logs')
    expect(prompt).toContain('ClickHouse')
    expect(prompt).toContain('```sql\nselect count(*) from edge_logs\n```')
    expect(prompt.toLowerCase()).toContain('rewrite')
  })

  it('asks for general guidance when no SQL is provided', () => {
    const prompt = buildClickhouseRewritePrompt('   ')
    expect(prompt).not.toContain('```sql')
    expect(prompt.toLowerCase()).toContain('how do i write queries')
  })

  it('includes the logs schema: table shape, sources, keys, and timestamp format', () => {
    for (const prompt of [
      buildClickhouseRewritePrompt(),
      buildClickhouseRewritePrompt('select 1'),
    ]) {
      expect(prompt).toContain('log_attributes')
      expect(prompt).toContain("source = 'edge_logs'")
      expect(prompt).toContain('auth_logs')
      expect(prompt).toContain('response.status_code')
      expect(prompt).toContain('toInt32OrZero')
      // Timestamp format the user flagged.
      expect(prompt).toContain('2026-06-22T09:34:06.215000')
    }
  })
})

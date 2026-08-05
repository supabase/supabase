import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  detectLogSource,
  looksLikeLegacyLogsQuery,
  rewriteLogsSqlWithAI,
  shouldOfferLegacyLogsRewrite,
  stripSqlCodeFences,
} from './logs-sql-rewrite'

describe('shouldOfferLegacyLogsRewrite', () => {
  const legacySql = 'select 1 from edge_logs cross join unnest(metadata) as m'

  it('offers the rewrite for BigQuery-dialect SQL once logs run on ClickHouse', () => {
    expect(shouldOfferLegacyLogsRewrite({ sql: legacySql, isClickhouseLogsEnabled: true })).toBe(
      true
    )
  })

  it('never offers it on a non-migrated org, where the BigQuery SQL is still correct', () => {
    expect(shouldOfferLegacyLogsRewrite({ sql: legacySql, isClickhouseLogsEnabled: false })).toBe(
      false
    )
  })

  it('does not offer it for SQL that is already ClickHouse, or for empty SQL', () => {
    expect(
      shouldOfferLegacyLogsRewrite({
        sql: "select timestamp from logs where source = 'edge_logs' limit 5",
        isClickhouseLogsEnabled: true,
      })
    ).toBe(false)
    expect(shouldOfferLegacyLogsRewrite({ sql: '', isClickhouseLogsEnabled: true })).toBe(false)
  })
})

describe('detectLogSource', () => {
  it('reads an explicit source filter', () => {
    expect(detectLogSource("select 1 from logs where source = 'edge_logs'")).toBe('edge_logs')
  })

  it('falls back to the legacy FROM table name', () => {
    expect(detectLogSource('select 1 from edge_logs as t')).toBe('edge_logs')
  })

  it('maps pg_cron_logs to postgres_logs from either the FROM table or the source filter', () => {
    expect(detectLogSource('select 1 from pg_cron_logs')).toBe('postgres_logs')
    expect(detectLogSource("select 1 from logs where source = 'pg_cron_logs'")).toBe(
      'postgres_logs'
    )
  })

  it('returns undefined for the bare logs table with no source', () => {
    expect(detectLogSource('select 1 from logs limit 5')).toBeUndefined()
  })

  it('returns undefined when nothing matches', () => {
    expect(detectLogSource('select 1')).toBeUndefined()
  })

  it('ignores a column that merely ends in "source"', () => {
    expect(detectLogSource("select 1 from logs where resource = 'nope'")).toBeUndefined()
    expect(detectLogSource("select 1 from logs where datasource = 'nope'")).toBeUndefined()
  })

  it('still reads a qualified source column', () => {
    expect(detectLogSource("select 1 from logs t where t.source = 'auth_logs'")).toBe('auth_logs')
  })

  it('prefers the real source column over a lookalike earlier in the query', () => {
    expect(detectLogSource("select resource = 'nope' from logs where source = 'edge_logs'")).toBe(
      'edge_logs'
    )
  })
})

describe('looksLikeLegacyLogsQuery', () => {
  it('flags per-service FROM tables', () => {
    expect(looksLikeLegacyLogsQuery('select 1 from edge_logs')).toBe(true)
  })

  it('flags unnest joins and the cast-timestamp idiom', () => {
    expect(looksLikeLegacyLogsQuery('select 1 from logs cross join unnest(metadata) as m')).toBe(
      true
    )
    expect(looksLikeLegacyLogsQuery('select cast(timestamp as datetime) from logs')).toBe(true)
  })

  it('does not flag a ClickHouse query against the logs table', () => {
    expect(
      looksLikeLegacyLogsQuery("select timestamp from logs where source = 'edge_logs' limit 5")
    ).toBe(false)
  })
})

describe('stripSqlCodeFences', () => {
  it('removes a ```sql fenced block', () => {
    expect(stripSqlCodeFences('```sql\nselect 1 from logs\n```')).toBe('select 1 from logs')
  })

  it('removes a plain ``` fenced block', () => {
    expect(stripSqlCodeFences('```\nselect 1\n```')).toBe('select 1')
  })

  it('leaves unfenced SQL untouched (trimmed)', () => {
    expect(stripSqlCodeFences('  select 1 from logs  ')).toBe('select 1 from logs')
  })

  it('extracts the fenced block when wrapped in prose', () => {
    expect(stripSqlCodeFences('Here is the rewrite:\n```sql\nselect 1 from logs\n```')).toBe(
      'select 1 from logs'
    )
  })
})

describe('rewriteLogsSqlWithAI', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('declares the rewrite intent and sends the query as the selection', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => '```sql\nselect 1 from logs\n```',
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await rewriteLogsSqlWithAI({
      sql: 'select 1 from edge_logs',
      projectRef: 'abc',
      availableKeys: ['request.method'],
    })

    expect(result).toBe('select 1 from logs')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/ai/code/complete')
    const body = JSON.parse(init.body)
    expect(body.dialect).toBe('clickhouse')
    expect(body.intent).toBe('rewrite')
    // The whole query is the selection, so the rewrite replaces all of it.
    expect(body.completionMetadata.selection).toBe('select 1 from edge_logs')
    expect(body.completionMetadata.textBeforeCursor).toBe('')
    expect(body.completionMetadata.textAfterCursor).toBe('')
    expect(body.completionMetadata.availableKeys).toEqual(['request.method'])
    // No prompt text is carried client-side — the route owns the instruction.
    expect(body.completionMetadata.prompt).toBe('')
  })

  it('throws when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, text: async () => 'boom' }))
    await expect(rewriteLogsSqlWithAI({ sql: 'select 1', projectRef: 'abc' })).rejects.toThrow(
      'boom'
    )
  })

  it('throws when the model returns an empty query', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => '   ' }))
    await expect(rewriteLogsSqlWithAI({ sql: 'select 1', projectRef: 'abc' })).rejects.toThrow(
      'empty'
    )
  })
})

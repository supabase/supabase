import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildClickhouseRewritePrompt,
  buildLogsCompletionPrompt,
  detectLogSource,
  looksLikeLegacyLogsQuery,
  rewriteLogsSqlWithAI,
  shouldOfferLegacyLogsRewrite,
  stripSqlCodeFences,
} from './logs-sql-rewrite'

describe('buildClickhouseRewritePrompt', () => {
  it('includes the query, the schema, and a reply-with-only-SQL instruction', () => {
    const prompt = buildClickhouseRewritePrompt('select count(*) from edge_logs')
    expect(prompt).toContain('select count(*) from edge_logs')
    expect(prompt).toContain('log_attributes')
    expect(prompt).toContain("source = 'edge_logs'")
    expect(prompt.toLowerCase()).toContain('reply with only')
  })

  it('demands a rewrite explicitly, since the system prompt only covers ClickHouse SQL generally', () => {
    const prompt = buildClickhouseRewritePrompt('select 1 from edge_logs')
    expect(prompt).toContain('REWRITE')
    expect(prompt).toContain('BigQuery query to rewrite:')
  })

  it('spells out the FROM-to-logs conversion and shows a worked example', () => {
    const prompt = buildClickhouseRewritePrompt('select 1 from postgres_logs')
    expect(prompt).toContain("from logs where source = 'postgres_logs'")
    expect(prompt.toLowerCase()).toContain('remove every')
    expect(prompt).toContain('cross join unnest')
    expect(prompt).toContain('BigQuery:')
    expect(prompt).toContain('ClickHouse:')
    expect(prompt).toContain("log_attributes['parsed.error_severity']")
  })

  it('lists the real log_attributes keys when provided and demands exact paths', () => {
    const prompt = buildClickhouseRewritePrompt('select 1 from edge_logs', [
      'request.headers.x_real_ip',
      'request.cf.country',
    ])
    expect(prompt).toContain("log_attributes['request.headers.x_real_ip']")
    expect(prompt).toContain("log_attributes['request.cf.country']")
    expect(prompt.toLowerCase()).toContain('exact')
  })

  it('omits the keys section when none are provided', () => {
    const prompt = buildClickhouseRewritePrompt('select 1 from edge_logs')
    expect(prompt).not.toContain('actual log_attributes keys present')
  })
})

describe('buildLogsCompletionPrompt', () => {
  const context = {
    instruction: 'only keep 5xx responses',
    textBeforeCursor: "select timestamp from logs where source = 'edge_logs'\n",
    selection: 'limit 5',
    textAfterCursor: '\n',
  }

  it('carries the logs schema, the query context, and the instruction', () => {
    const prompt = buildLogsCompletionPrompt(context)
    expect(prompt).toContain('log_attributes (Map(String, String))')
    expect(prompt).toContain("select timestamp from logs where source = 'edge_logs'")
    expect(prompt).toContain('<selection>limit 5</selection>')
    expect(prompt).toContain('only keep 5xx responses')
  })

  it('asks for only the SQL replacing the selection, with no fences', () => {
    const prompt = buildLogsCompletionPrompt(context)
    expect(prompt).toContain('Reply with ONLY the SQL that replaces the <selection> block')
    expect(prompt).toContain('no markdown code fences')
  })

  it('marks an empty selection as a cursor position', () => {
    const prompt = buildLogsCompletionPrompt({ ...context, selection: '' })
    expect(prompt).toContain('<selection></selection>')
    expect(prompt).toContain('An empty selection means')
  })

  it('lists the real log_attributes keys when provided and omits the section otherwise', () => {
    expect(
      buildLogsCompletionPrompt({ ...context, availableKeys: ['response.status_code'] })
    ).toContain("log_attributes['response.status_code']")
    expect(buildLogsCompletionPrompt(context)).not.toContain('actual log_attributes keys present')
  })
})

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

  it('posts to the completion endpoint and returns the cleaned query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => '```sql\nselect 1 from logs\n```',
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await rewriteLogsSqlWithAI({
      sql: 'select 1 from edge_logs',
      projectRef: 'abc',
    })

    expect(result).toBe('select 1 from logs')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/ai/code/complete')
    const body = JSON.parse(init.body)
    expect(body.dialect).toBe('clickhouse')
    expect(body.completionMetadata.selection).toBe('select 1 from edge_logs')
    expect(body.completionMetadata.prompt.toLowerCase()).toContain('reply with only')
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

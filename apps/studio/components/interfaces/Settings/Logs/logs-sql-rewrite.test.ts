import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildClickhouseRewritePrompt,
  detectLogSource,
  rewriteLogsSqlWithAI,
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

  it('spells out the FROM-to-logs conversion and shows a worked example', () => {
    const prompt = buildClickhouseRewritePrompt('select 1 from postgres_logs')
    // The core rule the model kept getting wrong: target `logs` + source filter.
    expect(prompt).toContain("from logs where source = 'postgres_logs'")
    expect(prompt.toLowerCase()).toContain('remove every')
    expect(prompt).toContain('cross join unnest')
    // A before/after example anchors the transformation.
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

describe('detectLogSource', () => {
  it('reads an explicit source filter', () => {
    expect(detectLogSource("select 1 from logs where source = 'edge_logs'")).toBe('edge_logs')
  })

  it('falls back to the legacy FROM table name', () => {
    expect(detectLogSource('select 1 from edge_logs as t')).toBe('edge_logs')
  })

  it('maps pg_cron_logs to postgres_logs', () => {
    expect(detectLogSource('select 1 from pg_cron_logs')).toBe('postgres_logs')
  })

  it('returns undefined for the bare logs table with no source', () => {
    expect(detectLogSource('select 1 from logs limit 5')).toBeUndefined()
  })

  it('returns undefined when nothing matches', () => {
    expect(detectLogSource('select 1')).toBeUndefined()
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
    await expect(rewriteLogsSqlWithAI({ sql: 'select 1' })).rejects.toThrow('boom')
  })

  it('throws when the model returns an empty query', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => '   ' }))
    await expect(rewriteLogsSqlWithAI({ sql: 'select 1' })).rejects.toThrow('empty')
  })
})

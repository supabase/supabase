import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildClickhouseRewritePrompt,
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

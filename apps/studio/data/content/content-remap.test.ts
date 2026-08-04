import { untrustedSql } from '@supabase/pg-meta'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { remapSqlContentField, remapSqlContentFields, unmapSqlContentField } from './content-remap'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

const SQL_SNIPPET = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  type: 'sql' as const,
  name: 'My query',
  content: {
    sql: 'SELECT 1',
    content_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    schema_version: '1.0',
  },
}

const LOG_SQL_SNIPPET = {
  id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22',
  type: 'log_sql' as const,
  name: 'My logs query',
  content: {
    sql: "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10",
    content_id: 'b1ffcd88-8d1a-4de7-aa5c-5aa8ac270b22',
    schema_version: '1',
  },
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('remapSqlContentField', () => {
  it('remaps content.sql to content.unchecked_sql for SQL snippets', () => {
    const result = remapSqlContentField(SQL_SNIPPET)

    expect(result.content).toEqual({
      content_id: SQL_SNIPPET.content.content_id,
      schema_version: '1.0',
      unchecked_sql: untrustedSql('SELECT 1'),
    })
    expect(result.content).not.toHaveProperty('sql')
  })

  it('remaps content.sql to content.unchecked_sql for log_sql snippets using the logs brand', () => {
    const result = remapSqlContentField(LOG_SQL_SNIPPET)

    expect(result.content).toEqual({
      content_id: LOG_SQL_SNIPPET.content.content_id,
      schema_version: '1',
      unchecked_sql: untrustedLogSql(LOG_SQL_SNIPPET.content.sql),
    })
    expect(result.content).not.toHaveProperty('sql')
  })

  it('leaves non-SQL content types unchanged', () => {
    const report = { id: '1', type: 'report' as const, content: { foo: 'bar' } }

    expect(remapSqlContentField(report)).toBe(report)
  })

  it('leaves SQL snippets without a content field unchanged', () => {
    const snippet = { id: '1', type: 'sql' as const, name: 'No content' }

    expect(remapSqlContentField(snippet)).toBe(snippet)
  })

  it('leaves SQL snippets whose content has no sql field unchanged', () => {
    const snippet = {
      id: '1',
      type: 'sql' as const,
      content: { content_id: '1', schema_version: '1.0', unchecked_sql: untrustedSql('x') },
    }

    expect(remapSqlContentField(snippet)).toBe(snippet)
  })
})

describe('remapSqlContentFields', () => {
  it('remaps every SQL snippet in a list', () => {
    const items = [SQL_SNIPPET, { id: '2', type: 'report' as const }]

    const result = remapSqlContentFields(items)
    const remappedSql = result.find((item) => item.type === 'sql')

    expect(remappedSql && 'content' in remappedSql && remappedSql.content).toMatchObject({
      unchecked_sql: untrustedSql('SELECT 1'),
    })
    expect(result[1]).toBe(items[1])
  })
})

describe('unmapSqlContentField', () => {
  it('remaps content.unchecked_sql back to content.sql for the API', () => {
    const snippet = remapSqlContentField(SQL_SNIPPET)

    const result = unmapSqlContentField(snippet)

    expect(result.content).toEqual({
      content_id: SQL_SNIPPET.content.content_id,
      schema_version: '1.0',
      sql: untrustedSql('SELECT 1'),
    })
    expect(result.content).not.toHaveProperty('unchecked_sql')
  })

  it('remaps content.unchecked_sql back to content.sql for log_sql snippets', () => {
    const snippet = remapSqlContentField(LOG_SQL_SNIPPET)

    const result = unmapSqlContentField(snippet)

    expect(result.content).toEqual({
      content_id: LOG_SQL_SNIPPET.content.content_id,
      schema_version: '1',
      sql: LOG_SQL_SNIPPET.content.sql,
    })
    expect(result.content).not.toHaveProperty('unchecked_sql')
  })

  it('leaves non-SQL content types unchanged', () => {
    const report = { id: '1', type: 'report' as const, content: { foo: 'bar' } }

    expect(unmapSqlContentField(report)).toBe(report)
  })

  it('leaves content without a sql or unchecked_sql field unchanged (never fabricates sql)', () => {
    const snippet = {
      id: '1',
      type: 'sql' as const,
      content: { content_id: '1', schema_version: '1.0' },
    }

    const result = unmapSqlContentField(snippet)

    expect(result).toBe(snippet)
    expect(result.content).not.toHaveProperty('sql')
  })

  it('throws in development when content still carries a raw sql field (missed rename)', () => {
    const snippet = {
      id: '1',
      type: 'log_sql' as const,
      content: { content_id: '1', schema_version: '1', sql: 'select 1' },
    }

    expect(() => unmapSqlContentField(snippet)).toThrow(/not migrated/)
  })

  it('never clobbers a raw sql field in production (defensive no-op)', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const snippet = {
      id: '1',
      type: 'log_sql' as const,
      content: { content_id: '1', schema_version: '1', sql: 'select 1' },
    }

    const result = unmapSqlContentField(snippet)

    // The pre-rename `{ sql }` shape is already the wire shape, so passing it through
    // untouched is correct — and crucially avoids writing `sql: undefined`.
    expect(result).toBe(snippet)
    expect(result.content.sql).toBe('select 1')
  })
})

describe('remap/unmap round-trip', () => {
  it('returns the original content shape after remap then unmap for sql snippets', () => {
    const result = unmapSqlContentField(remapSqlContentField(SQL_SNIPPET))

    expect(result.content).toEqual(SQL_SNIPPET.content)
  })

  it('returns the original content shape after remap then unmap for log_sql snippets', () => {
    const result = unmapSqlContentField(remapSqlContentField(LOG_SQL_SNIPPET))

    expect(result.content).toEqual(LOG_SQL_SNIPPET.content)
  })
})

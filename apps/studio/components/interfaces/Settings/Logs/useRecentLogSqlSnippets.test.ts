import { describe, expect, it } from 'vitest'

import { normalizeRecentLogSqlSnippet } from './useRecentLogSqlSnippets'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

const SQL = "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10"

describe('normalizeRecentLogSqlSnippet', () => {
  it('brands a legacy raw `sql` entry into `unchecked_sql`', () => {
    const result = normalizeRecentLogSqlSnippet({
      content_id: 'a',
      schema_version: '1',
      sql: SQL,
    })

    expect(result).toEqual({
      content_id: 'a',
      schema_version: '1',
      unchecked_sql: untrustedLogSql(SQL),
    })
    expect(result).not.toHaveProperty('sql')
  })

  it('preserves an already-branded `unchecked_sql` entry', () => {
    const result = normalizeRecentLogSqlSnippet({
      content_id: 'b',
      schema_version: '1',
      unchecked_sql: untrustedLogSql(SQL),
    })

    expect(result).toEqual({
      content_id: 'b',
      schema_version: '1',
      unchecked_sql: untrustedLogSql(SQL),
    })
    expect(result).not.toHaveProperty('sql')
  })

  it('defaults to an empty branded string when neither field is present', () => {
    const result = normalizeRecentLogSqlSnippet({ content_id: 'c', schema_version: '1' })

    expect(result.unchecked_sql).toEqual(untrustedLogSql(''))
  })
})

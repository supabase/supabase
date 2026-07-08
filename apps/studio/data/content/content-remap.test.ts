import { untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { remapSqlContentField, remapSqlContentFields, unmapSqlContentField } from './content-remap'

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

  it('leaves non-SQL content types unchanged', () => {
    const report = { id: '1', type: 'report' as const, content: { foo: 'bar' } }

    expect(unmapSqlContentField(report)).toBe(report)
  })

  it('leaves SQL snippets whose content has no unchecked_sql field unchanged', () => {
    const snippet = {
      id: '1',
      type: 'sql' as const,
      content: { content_id: '1', schema_version: '1.0', sql: 'SELECT 1' },
    }

    expect(unmapSqlContentField(snippet)).toBe(snippet)
  })
})

describe('remap/unmap round-trip', () => {
  it('returns the original content shape after remap then unmap', () => {
    const result = unmapSqlContentField(remapSqlContentField(SQL_SNIPPET))

    expect(result.content).toEqual(SQL_SNIPPET.content)
  })
})

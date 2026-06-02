import { describe, expect, it } from 'vitest'

import {
  buildSnippetUpsertContent,
  getSnippetContentType,
  getSnippetQuerySource,
} from './sqlSnippet.utils'

describe('sqlSnippet.utils', () => {
  it('serializes logs snippets from the snippet type instead of ambient editor state', () => {
    const snippet = {
      type: 'log_sql',
      content: {
        content_id: 'query-1',
        unchecked_sql: 'select 1',
        schema_version: '1.0',
      },
    }

    const type = getSnippetContentType(snippet)

    expect(type).toBe('log_sql')
    expect(getSnippetQuerySource(snippet)).toBe('logs')
    expect(buildSnippetUpsertContent('query-1', type, snippet.content)).toEqual({
      content_id: 'query-1',
      schema_version: '1.0',
      sql: 'select 1',
    })
  })

  it('serializes database snippets with an explicit database source', () => {
    expect(
      buildSnippetUpsertContent('query-1', 'sql', {
        content_id: 'query-1',
        unchecked_sql: 'select 1',
        schema_version: '1.0',
      })
    ).toEqual({
      content_id: 'query-1',
      unchecked_sql: 'select 1',
      schema_version: '1.0',
      query_source: 'database',
    })
  })
})

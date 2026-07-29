import { untrustedSql } from '@supabase/pg-meta'
import { beforeEach, describe, expect, it } from 'vitest'

import { sqlEditorState } from './sql-editor-state'
import type { SnippetWithContent } from '@/data/content/sql-folders-query'

function makeSnippet(
  id: string,
  overrides: Omit<Partial<SnippetWithContent>, 'content'> = {}
): SnippetWithContent {
  return {
    id,
    type: 'sql',
    name: 'My Query',
    description: 'A description',
    visibility: 'user',
    project_id: 42,
    owner_id: 7,
    folder_id: null,
    favorite: false,
    status: 'saved',
    inserted_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
    content: {
      content_id: id,
      schema_version: '1',
      unchecked_sql: untrustedSql('SELECT * FROM users;'),
    },
  }
}

describe('addFavorite / removeFavorite', () => {
  beforeEach(() => {
    // sqlEditorState is a module-level singleton, so reset the state these tests touch
    for (const id of Object.keys(sqlEditorState.snippets)) {
      delete sqlEditorState.snippets[id]
    }
    sqlEditorState.needsSaving.clear()
  })

  it('marks a loaded snippet as favorite and queues it for saving', () => {
    sqlEditorState.addSnippet({ projectRef: 'ref', snippet: makeSnippet('snippet-1') })

    sqlEditorState.addFavorite('snippet-1')

    expect(sqlEditorState.snippets['snippet-1'].snippet.favorite).toBe(true)
    expect(sqlEditorState.needsSaving.get('snippet-1')).toBe(true)
  })

  it('unmarks a favorited snippet and queues it for saving', () => {
    sqlEditorState.addSnippet({
      projectRef: 'ref',
      snippet: makeSnippet('snippet-1', { favorite: true }),
    })

    sqlEditorState.removeFavorite('snippet-1')

    expect(sqlEditorState.snippets['snippet-1'].snippet.favorite).toBe(false)
    expect(sqlEditorState.needsSaving.get('snippet-1')).toBe(true)
  })

  it('ignores addFavorite for a snippet that is not in the store', () => {
    expect(() => sqlEditorState.addFavorite('missing')).not.toThrow()
    expect(sqlEditorState.needsSaving.has('missing')).toBe(false)
  })

  it('ignores removeFavorite for a snippet that is not in the store', () => {
    expect(() => sqlEditorState.removeFavorite('missing')).not.toThrow()
    expect(sqlEditorState.needsSaving.has('missing')).toBe(false)
  })
})

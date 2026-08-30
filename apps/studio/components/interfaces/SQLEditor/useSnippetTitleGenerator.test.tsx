import { act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useSnippetTitleGenerator } from './useSnippetTitleGenerator'
import { sqlEditorState } from '@/state/sql-editor/sql-editor-state'
import {
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
  setupSqlEditorMocks,
} from '@/tests/lib/sql-editor-test-utils'

const SNIPPET_ID = 'title-snippet'

beforeEach(() => {
  resetSqlEditorStores()
  // The title endpoint (POST /ai/sql/title-v2) returns { title: 'Generated title' }.
  setupSqlEditorMocks()
  seedSnippet({ id: SNIPPET_ID, name: 'Untitled query', sql: 'select 1;' })
})

afterEach(() => {
  resetSqlEditorStores()
})

describe('useSnippetTitleGenerator', () => {
  it('names an untitled snippet from the generated title and queues it for saving', async () => {
    const { result } = renderSqlEditorHook(useSnippetTitleGenerator)

    await act(async () => {
      await result.current.setAiTitle(SNIPPET_ID, 'select 1;')
    })

    await waitFor(() =>
      expect(sqlEditorState.snippets[SNIPPET_ID].snippet.name).toBe('Generated title')
    )
    expect(sqlEditorState.needsSaving.has(SNIPPET_ID)).toBe(true)
  })

  it('returns the generated title from generateSqlTitle', async () => {
    const { result } = renderSqlEditorHook(useSnippetTitleGenerator)

    let title: string | undefined
    await act(async () => {
      title = (await result.current.generateSqlTitle({ sql: 'select 1;' })).title
    })

    expect(title).toBe('Generated title')
  })
})

import { act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSnippetEditor } from './useSnippetEditor'
import { sqlEditorState } from '@/state/sql-editor/sql-editor-state'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import {
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
  setupSqlEditorMocks,
} from '@/tests/lib/sql-editor-test-utils'

const PROFILE_CONTEXT = createMockProfileContext()

describe('useSnippetEditor', () => {
  beforeEach(() => {
    resetSqlEditorStores()
    setupSqlEditorMocks()
  })

  it('writing in a newly opened tab does not overwrite an already-open tab', async () => {
    seedSnippet({ id: 'existing-tab', sql: 'select existing;' })

    // Mount the editor for the already-open tab, mirroring the keyed
    // MonacoEditor mount for that snippet id, then unmount it the way opening
    // a new tab would (the `key={id}` wrapper swaps to a brand new instance).
    const first = renderSqlEditorHook(useSnippetEditor, {
      initialProps: { id: 'existing-tab', snippetName: 'Existing tab' },
      profileContext: PROFILE_CONTEXT,
    })
    await waitFor(() => expect(first.result.current.snippet).toBeDefined())
    first.unmount()

    // Mount a fresh instance for a brand new tab, as clicking "+" would.
    const second = renderSqlEditorHook(useSnippetEditor, {
      initialProps: { id: 'new-tab-id', snippetName: 'New query' },
      profileContext: PROFILE_CONTEXT,
    })

    // `handleEditorChange` only creates the new snippet once the project has
    // loaded, so retry the keystroke until that happens.
    await waitFor(() => {
      act(() => {
        second.result.current.handleEditorChange('select typed content;')
      })
      expect(sqlEditorState.snippets['new-tab-id']?.snippet.content?.unchecked_sql).toContain(
        'typed content'
      )
    })

    expect(sqlEditorState.snippets['existing-tab'].snippet.content?.unchecked_sql).toContain(
      'select existing'
    )
  })
})

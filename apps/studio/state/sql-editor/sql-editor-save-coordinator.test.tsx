import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, waitFor } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SqlEditorSaveCoordinatorProvider } from './sql-editor-save-coordinator'
import { sqlEditorState } from './sql-editor-state'
import type { SnippetWithContent } from '@/data/content/sql-folders-query'
import { createTabsState, TabsStateContext } from '@/state/tabs'

vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsSqlEditorManualSaveEnabled: () => true,
}))

const SNIPPET_ID = 'snippet-a'

const renderCoordinator = () => {
  const tabsStore = createTabsState('default')
  tabsStore.addTab({
    id: `sql-${SNIPPET_ID}`,
    type: 'sql',
    label: 'Snippet A',
    isPreview: false,
    metadata: { sqlId: SNIPPET_ID },
  })

  render(
    <QueryClientProvider client={new QueryClient()}>
      <TabsStateContext.Provider value={tabsStore}>
        <SqlEditorSaveCoordinatorProvider>{null}</SqlEditorSaveCoordinatorProvider>
      </TabsStateContext.Provider>
    </QueryClientProvider>
  )

  return tabsStore
}

describe('SqlEditorSaveCoordinatorProvider close confirmation', () => {
  beforeEach(() => {
    localStorage.clear()
    sqlEditorState.snippets[SNIPPET_ID] = {
      projectRef: 'default',
      snippet: { id: SNIPPET_ID, status: 'unsaved' } as SnippetWithContent,
    } as (typeof sqlEditorState.snippets)[string]
  })

  it('asks to confirm closing a snippet with unsaved edits by default', async () => {
    const tabsStore = renderCoordinator()

    await waitFor(() =>
      expect(tabsStore.getCloseConfirmation([`sql-${SNIPPET_ID}`])).toMatchObject({
        title: 'Unsaved changes',
      })
    )
  })

  it('closes without asking once the user has opted out', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SQL_EDITOR_CONFIRM_UNSAVED_CHANGES, 'false')
    const tabsStore = renderCoordinator()

    // Passes only once the stored value loads: the default is to confirm.
    await waitFor(() => expect(tabsStore.getCloseConfirmation([`sql-${SNIPPET_ID}`])).toBeNull())
  })

  it('turns the confirmation off when the opt-out is chosen', async () => {
    const tabsStore = renderCoordinator()

    await waitFor(() =>
      expect(tabsStore.getCloseConfirmation([`sql-${SNIPPET_ID}`])?.optOut).toBeDefined()
    )

    act(() => tabsStore.getCloseConfirmation([`sql-${SNIPPET_ID}`])?.optOut?.onOptOut())

    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.SQL_EDITOR_CONFIRM_UNSAVED_CHANGES)).toBe(
      'false'
    )
    await waitFor(() => expect(tabsStore.getCloseConfirmation([`sql-${SNIPPET_ID}`])).toBeNull())
  })
})

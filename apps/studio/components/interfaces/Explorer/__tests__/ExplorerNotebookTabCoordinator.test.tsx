import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ExplorerNotebookTabCoordinator } from '../ExplorerNotebookTabCoordinator'
import { createQueryCellSkeleton } from '../utils'
import { contentKeys } from '@/data/content/keys'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'
import { createTabId, createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'
import type { Notebooks } from '@/types'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
  }
})

const NOTEBOOK_ID = 'notebook-coordinator-test'

const seedNotebook = (status: 'new' | 'saved', cells: Notebooks.Cell[] = []) => {
  delete notebooksState.notebooks[NOTEBOOK_ID]
  const notebook: Notebook = {
    id: NOTEBOOK_ID,
    type: 'notebook',
    name: 'Test notebook',
    visibility: 'project',
    favorite: false,
    owner_id: 1,
    project_id: 1,
    content: { schema_version: 1, cells },
  }
  if (status === 'new') notebooksState.addNotebook({ projectRef: 'default', notebook })
  else notebooksState.setNotebook({ projectRef: 'default', notebook })
}

const renderCoordinator = (queryClient: QueryClient) => {
  const tabsState = createTabsState('default')
  const tabId = createTabId('notebook', { id: NOTEBOOK_ID })
  tabsState.addTab({ id: tabId, type: 'notebook', metadata: { notebookId: NOTEBOOK_ID } })

  customRender(
    <TabsStateContext.Provider value={tabsState}>
      <ExplorerNotebookTabCoordinator />
    </TabsStateContext.Provider>,
    { queryClient }
  )

  return { tabsState, tabId }
}

afterEach(() => {
  delete notebooksState.notebooks[NOTEBOOK_ID]
  notebooksState.needsSaving.clear()
})

describe('ExplorerNotebookTabCoordinator', () => {
  it('flushes a saved notebook from the store and evicts its cache entry on close', () => {
    seedNotebook('saved')
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource('default', NOTEBOOK_ID), { id: NOTEBOOK_ID })

    const { tabsState, tabId } = renderCoordinator(queryClient)
    tabsState.closeTabs([tabId])

    expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeUndefined()
    expect(queryClient.getQueryData(contentKeys.resource('default', NOTEBOOK_ID))).toBeUndefined()
  })

  it('discards an unsaved notebook from the store and cache on confirmed close', () => {
    seedNotebook('new', [createQueryCellSkeleton()])
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource('default', NOTEBOOK_ID), { id: NOTEBOOK_ID })

    const { tabsState, tabId } = renderCoordinator(queryClient)
    tabsState.closeTabs([tabId])

    expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeUndefined()
    expect(queryClient.getQueryData(contentKeys.resource('default', NOTEBOOK_ID))).toBeUndefined()
  })

  it('asks for confirmation before closing a notebook with unsaved changes', () => {
    seedNotebook('new', [createQueryCellSkeleton()])
    const { tabsState, tabId } = renderCoordinator(new QueryClient())

    expect(tabsState.getCloseConfirmation([tabId])).toEqual({
      title: 'Unsaved changes',
      description: 'You have unsaved changes in this notebook. Closing it will discard them.',
    })
  })

  it('does not ask for confirmation when closing a saved notebook with no local edits', () => {
    seedNotebook('saved')
    const { tabsState, tabId } = renderCoordinator(new QueryClient())

    expect(tabsState.getCloseConfirmation([tabId])).toBeNull()
  })

  it('does not ask for confirmation when closing an empty, never-persisted notebook', () => {
    seedNotebook('new', [])
    const { tabsState, tabId } = renderCoordinator(new QueryClient())

    expect(tabsState.getCloseConfirmation([tabId])).toBeNull()
  })
})

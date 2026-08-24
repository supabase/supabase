import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { ExplorerNotebookTab } from '../ExplorerNotebookTab'
import type { components } from '@/data/api'
import { contentKeys } from '@/data/content/keys'
import {
  applyNotebookCacheEffects,
  collectNotebookCacheEffects,
} from '@/lib/ai/notebook-cache-invalidation'
import { createAssistantMessageWithUpdateNotebookTool } from '@/lib/ai/test-fixtures'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'
import { createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'

const PROJECT_REF = 'default'
const NOTEBOOK_ID = 'notebook-assistant-cache-test'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => ({ ref: 'default', id: 'notebook-assistant-cache-test' }),
    useFlag: () => false,
  }
})

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: ({ value }: { value: string }) => (
    <textarea aria-label="SQL editor" value={value} readOnly />
  ),
}))

vi.mock('../QueryEditor/QuerySourceMenu', () => ({
  QuerySourceMenu: () => null,
}))

const seedNotebook = () => {
  delete notebooksState.notebooks[NOTEBOOK_ID]
  const notebook: Notebook = {
    id: NOTEBOOK_ID,
    type: 'notebook',
    name: 'Test notebook',
    visibility: 'project',
    favorite: false,
    owner_id: 1,
    project_id: 1,
    content: {
      schema_version: 1,
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'Original content' }],
    },
  }
  notebooksState.setNotebook({ projectRef: PROJECT_REF, notebook })
}

const renderNotebookTab = (queryClient: QueryClient) =>
  customRender(
    <TabsStateContext.Provider value={createTabsState(PROJECT_REF)}>
      <ExplorerNotebookTab />
    </TabsStateContext.Provider>,
    { queryClient }
  )

describe('ExplorerNotebookTab — assistant cache invalidation', () => {
  it('refetches and renders the updated cells after an assistant update_notebook tool call completes', async () => {
    setupSqlEditorMocks()
    seedNotebook()

    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/item/:id',
      response: () =>
        HttpResponse.json<components['schemas']['GetUserContentByIdResponse']>({
          id: NOTEBOOK_ID,
          type: 'notebook',
          name: 'Test notebook',
          description: '',
          favorite: false,
          folder_id: null,
          inserted_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
          visibility: 'project',
          owner_id: 1,
          project_id: 1,
          content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'Updated by assistant' }],
          },
        }),
    })

    renderNotebookTab(queryClient)

    expect(await screen.findByText('Original content')).toBeInTheDocument()

    const message = createAssistantMessageWithUpdateNotebookTool({
      id: NOTEBOOK_ID,
      name: 'Test notebook',
    })
    const effects = collectNotebookCacheEffects([message], new Set())
    await applyNotebookCacheEffects({ queryClient, projectRef: PROJECT_REF, effects })

    expect(await screen.findByText('Updated by assistant')).toBeInTheDocument()
    expect(screen.queryByText('Original content')).not.toBeInTheDocument()
  })

  it('shows the updated cells on remount, when the query cache still holds the pre-eviction notebook', async () => {
    setupSqlEditorMocks()
    seedNotebook()

    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), {
      id: NOTEBOOK_ID,
      type: 'notebook',
      name: 'Test notebook',
      description: '',
      favorite: false,
      visibility: 'project',
      owner_id: 1,
      project_id: 1,
      inserted_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      content: {
        schema_version: 1,
        cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'Original content' }],
      },
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/item/:id',
      response: () =>
        HttpResponse.json<components['schemas']['GetUserContentByIdResponse']>({
          id: NOTEBOOK_ID,
          type: 'notebook',
          name: 'Test notebook',
          description: '',
          favorite: false,
          folder_id: null,
          inserted_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
          visibility: 'project',
          owner_id: 1,
          project_id: 1,
          content: {
            schema_version: 1,
            cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'Updated by assistant' }],
          },
        }),
    })

    // While the tab is unmounted (navigated away to a separate Explorer chat tab), the
    // assistant updates the notebook.
    const message = createAssistantMessageWithUpdateNotebookTool({
      id: NOTEBOOK_ID,
      name: 'Test notebook',
    })
    const effects = collectNotebookCacheEffects([message], new Set())
    await applyNotebookCacheEffects({ queryClient, projectRef: PROJECT_REF, effects })

    // Simulate navigating back: the notebook tab mounts fresh.
    renderNotebookTab(queryClient)

    expect(await screen.findByText('Updated by assistant')).toBeInTheDocument()
    expect(screen.queryByText('Original content')).not.toBeInTheDocument()
  })
})

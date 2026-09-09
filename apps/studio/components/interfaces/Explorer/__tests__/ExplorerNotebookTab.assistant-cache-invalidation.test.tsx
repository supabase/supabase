import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ExplorerNotebookTab } from '../ExplorerNotebookTab'
import type { components } from '@/data/api'
import { contentKeys } from '@/data/content/keys'
import {
  applyNotebookCacheEffects,
  collectNotebookCacheEffects,
} from '@/lib/ai/notebook-cache-invalidation'
import {
  createAssistantMessageWithDeleteNotebookTool,
  createAssistantMessageWithUpdateNotebookTool,
} from '@/lib/ai/test-fixtures'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'
import { createTabId, createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
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

const renderNotebookTab = (queryClient: QueryClient, tabsState = createTabsState(PROJECT_REF)) =>
  customRender(
    <TabsStateContext.Provider value={tabsState}>
      <ExplorerNotebookTab />
    </TabsStateContext.Provider>,
    { queryClient }
  )

afterEach(() => {
  notebooksState.serverDivergedWhileDirty.clear()
})

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

  it('shows the not-found state after an assistant delete_notebook tool call completes', async () => {
    setupSqlEditorMocks()
    seedNotebook()

    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/item/:id',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Notebook not found' }, { status: 404 }),
    })

    renderNotebookTab(queryClient)

    expect(await screen.findByText('Original content')).toBeInTheDocument()

    const message = createAssistantMessageWithDeleteNotebookTool({
      id: NOTEBOOK_ID,
      name: 'Test notebook',
    })
    const effects = collectNotebookCacheEffects([message], new Set())
    await applyNotebookCacheEffects({ queryClient, projectRef: PROJECT_REF, effects })

    expect(await screen.findByText('Notebook not found')).toBeInTheDocument()
    expect(screen.queryByText('Original content')).not.toBeInTheDocument()
  })

  it('saves normally without a conflict dialog when the notebook has not diverged', async () => {
    setupSqlEditorMocks()
    seedNotebook()
    const queryClient = new QueryClient()
    let mutationCount = 0
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () => {
        mutationCount += 1
        return HttpResponse.json({ id: NOTEBOOK_ID })
      },
    })

    renderNotebookTab(queryClient)

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(mutationCount).toBe(1))
    expect(
      screen.queryByRole('dialog', { name: 'Assistant changes detected' })
    ).not.toBeInTheDocument()
  })

  it.each([
    {
      type: 'updated' as const,
      description:
        "An assistant updated this notebook after your local changes. Saving will overwrite the assistant's update.",
      saveLabel: 'Save anyway',
    },
    {
      type: 'deleted' as const,
      description:
        'An assistant deleted this notebook after your local changes. Saving will recreate it.',
      saveLabel: 'Recreate',
    },
  ])('shows the $type conflict copy before saving', async ({ type, description, saveLabel }) => {
    setupSqlEditorMocks()
    seedNotebook()
    notebooksState.updateCells({
      id: NOTEBOOK_ID,
      cells: notebooksState.notebooks[NOTEBOOK_ID]!.notebook.content!.cells,
    })
    notebooksState.markServerDivergence({ id: NOTEBOOK_ID, type })

    renderNotebookTab(new QueryClient())

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

    const dialog = await screen.findByRole('dialog', { name: 'Assistant changes detected' })
    expect(dialog).toHaveTextContent(description)
    expect(dialog).toHaveTextContent(saveLabel)
    expect(dialog).toHaveTextContent('Discard changes')
  })

  it('saves exactly once and clears the conflict only after a successful save', async () => {
    setupSqlEditorMocks()
    seedNotebook()
    notebooksState.updateCells({
      id: NOTEBOOK_ID,
      cells: notebooksState.notebooks[NOTEBOOK_ID]!.notebook.content!.cells,
    })
    notebooksState.markServerDivergence({ id: NOTEBOOK_ID, type: 'updated' })
    const queryClient = new QueryClient()
    let mutationCount = 0
    let resolveSave: (() => void) | undefined
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve
    })
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async () => {
        mutationCount += 1
        await savePromise
        return HttpResponse.json({ id: NOTEBOOK_ID })
      },
    })

    renderNotebookTab(queryClient)

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    expect(notebooksState.serverDivergedWhileDirty.get(NOTEBOOK_ID)).toBe('updated')
    await userEvent.click(await screen.findByRole('button', { name: 'Save anyway' }))

    await waitFor(() => expect(mutationCount).toBe(1))
    expect(notebooksState.serverDivergedWhileDirty.get(NOTEBOOK_ID)).toBe('updated')
    resolveSave?.()
    await waitFor(() =>
      expect(notebooksState.serverDivergedWhileDirty.has(NOTEBOOK_ID)).toBe(false)
    )
  })

  it('keeps the conflict marker when saving anyway fails', async () => {
    setupSqlEditorMocks()
    seedNotebook()
    notebooksState.updateCells({
      id: NOTEBOOK_ID,
      cells: notebooksState.notebooks[NOTEBOOK_ID]!.notebook.content!.cells,
    })
    notebooksState.markServerDivergence({ id: NOTEBOOK_ID, type: 'updated' })
    let mutationCount = 0
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () => {
        mutationCount += 1
        return HttpResponse.json({ message: 'Save failed' }, { status: 500 })
      },
    })

    renderNotebookTab(new QueryClient())

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Save anyway' }))

    await waitFor(() => expect(mutationCount).toBe(1))
    expect(notebooksState.serverDivergedWhileDirty.get(NOTEBOOK_ID)).toBe('updated')
  })

  it('omits existing cell IDs when saving anyway recreates an assistant-deleted notebook', async () => {
    setupSqlEditorMocks()
    seedNotebook()
    notebooksState.updateCells({
      id: NOTEBOOK_ID,
      cells: notebooksState.notebooks[NOTEBOOK_ID]!.notebook.content!.cells,
    })
    notebooksState.markServerDivergence({ id: NOTEBOOK_ID, type: 'deleted' })
    let sentBody: Record<string, unknown> | undefined
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: NOTEBOOK_ID })
      },
    })

    renderNotebookTab(new QueryClient())

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Recreate' }))

    await waitFor(() => expect(sentBody).toBeDefined())
    const content = sentBody?.content as { cells: Array<Record<string, unknown>> }
    content.cells.forEach((cell) => expect(cell).not.toHaveProperty('_id'))
  })

  it('discards local changes without mutating and evicts the conflicted notebook', async () => {
    setupSqlEditorMocks()
    seedNotebook()
    notebooksState.updateCells({
      id: NOTEBOOK_ID,
      cells: notebooksState.notebooks[NOTEBOOK_ID]!.notebook.content!.cells,
    })
    notebooksState.markServerDivergence({ id: NOTEBOOK_ID, type: 'updated' })
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })
    let mutationCount = 0
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () => {
        mutationCount += 1
        return HttpResponse.json({ id: NOTEBOOK_ID })
      },
    })

    renderNotebookTab(queryClient)

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }))

    await waitFor(() => expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeUndefined())
    expect(notebooksState.serverDivergedWhileDirty.has(NOTEBOOK_ID)).toBe(false)
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))).toBeUndefined()
    expect(mutationCount).toBe(0)
  })

  it('closes the notebook tab when discarding edits after an assistant deletion', async () => {
    setupSqlEditorMocks()
    seedNotebook()
    notebooksState.updateCells({
      id: NOTEBOOK_ID,
      cells: notebooksState.notebooks[NOTEBOOK_ID]!.notebook.content!.cells,
    })
    notebooksState.markServerDivergence({ id: NOTEBOOK_ID, type: 'deleted' })
    const tabsState = createTabsState(PROJECT_REF)
    const tabId = createTabId('notebook', { id: NOTEBOOK_ID })
    tabsState.addTab({ id: tabId, type: 'notebook', metadata: { notebookId: NOTEBOOK_ID } })

    renderNotebookTab(new QueryClient(), tabsState)

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }))

    await waitFor(() => expect(tabsState.tabsMap[tabId]).toBeUndefined())
  })

  it.each(['the close button', 'the backdrop'])(
    'dismisses the conflict with %s without changing notebook state',
    async (dismissal) => {
      setupSqlEditorMocks()
      seedNotebook()
      notebooksState.updateCells({
        id: NOTEBOOK_ID,
        cells: notebooksState.notebooks[NOTEBOOK_ID]!.notebook.content!.cells,
      })
      notebooksState.markServerDivergence({ id: NOTEBOOK_ID, type: 'updated' })

      renderNotebookTab(new QueryClient())

      await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
      const dialog = await screen.findByRole('dialog', { name: 'Assistant changes detected' })
      if (dismissal === 'the close button') {
        await userEvent.click(screen.getByRole('button', { name: 'Close' }))
      } else {
        fireEvent.pointerDown(dialog.parentElement!, { button: 0, ctrlKey: false })
      }

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'Assistant changes detected' })
        ).not.toBeInTheDocument()
      )
      expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeDefined()
      expect(notebooksState.serverDivergedWhileDirty.get(NOTEBOOK_ID)).toBe('updated')
    }
  )
})

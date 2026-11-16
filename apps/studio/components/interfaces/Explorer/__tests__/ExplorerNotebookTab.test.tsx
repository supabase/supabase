import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerNotebookTab } from '../ExplorerNotebookTab'
import { setCellSql } from '../QueryCell/QueryCell.utils'
import { createMarkdownCellSkeleton, createQueryCellSkeleton } from '../utils'
import { ExplorerProvider } from '@/components/layouts/ExplorerLayout/ExplorerProvider'
import type { components } from '@/data/api'
import { contentKeys } from '@/data/content/keys'
import { isQueryCell } from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
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
import type { Notebooks } from '@/types'

const testContext = vi.hoisted(() => ({
  track: vi.fn(),
  flags: { otelLegacyLogs: true } as Record<string, boolean>,
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => testContext.track }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => ({ ref: 'default', id: 'notebook-test' }),
    useFlag: (flag: string) => testContext.flags[flag] ?? false,
  }
})

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onInputChange,
  }: {
    value: string
    onInputChange?: (value: string | undefined) => void
  }) => (
    <textarea
      aria-label="SQL editor"
      value={value}
      onChange={(e) => onInputChange?.(e.target.value)}
    />
  ),
}))

vi.mock('../QueryEditor/QuerySourceMenu', () => ({
  QuerySourceMenu: () => null,
}))

const PROJECT_REF = 'default'
const NOTEBOOK_ID = 'notebook-test'

const databaseCell = createQueryCellSkeleton({ sql: 'select 1' })
const logCell = {
  _tag: 'log_cell' as const,
  _id: 'log-cell-1',
  view: 'table' as const,
  chart: undefined,
  unchecked_sql: untrustedLogSql('select * from edge_logs limit 1'),
  time_range: { _tag: 'relative_time_range' as const, amount: 1, unit: 'hour' as const },
}
const markdownCell = createMarkdownCellSkeleton()

/** Clears any prior fixture so seeding exercises the same store-loading path as the app. */
const seedNotebook = (cells: Notebooks.Cell[], status: 'new' | 'saved' = 'saved') => {
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

const renderNotebookTab = ({
  tabsState = createTabsState(PROJECT_REF),
  queryClient,
}: { tabsState?: ReturnType<typeof createTabsState>; queryClient?: QueryClient } = {}) =>
  customRender(
    <TabsStateContext.Provider value={tabsState}>
      <ExplorerProvider>
        <ExplorerNotebookTab />
      </ExplorerProvider>
    </TabsStateContext.Provider>,
    { queryClient }
  )

// `useAddDefinitions` fires its own background keywords/functions/schemas/table-columns
// fetches, and `QueryEditor` fires a background database-event-triggers fetch (for the
// run-time RLS/event-trigger warning check), against this same generic pg-meta query
// endpoint (differentiated by the `key` search param) as soon as a database cell's editor
// mounts — those are expected and unrelated to an actual cell run.
const BACKGROUND_QUERY_KEYS = ['keywords', 'database-functions', 'schemas', 'table-columns']
const isBackgroundQueryKey = (key: string) =>
  BACKGROUND_QUERY_KEYS.includes(key) || key.endsWith('database-event-triggers')

/** Mocks the database query endpoint and returns the SQL text of every non-background request. */
const mockDatabaseQueryRequests = () => {
  const queries: string[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const key = new URL(request.url).searchParams.get('key')
      if (!key || !isBackgroundQueryKey(key)) {
        const body = (await request.clone().json()) as { query?: string }
        queries.push(body.query ?? '')
      }
      return HttpResponse.json([{ result: 1 }])
    },
  })
  return queries
}

beforeEach(() => {
  testContext.track.mockClear()
  setupSqlEditorMocks()
  testContext.flags.otelLegacyLogs = true
  for (const id of Object.keys(notebooksState.notebooks)) {
    delete notebooksState.notebooks[id]
  }
  seedNotebook([databaseCell, logCell, markdownCell])
})

afterEach(() => {
  notebooksState.needsSaving.clear()
  notebooksState.cellLocalState.clear()
  notebooksState.serverDivergedWhileDirty.clear()
  safeLocalStorage.removeItem(LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE)
})

describe('ExplorerNotebookTab', () => {
  it('hides SQL by default for saved notebooks and caps query cells from their sortable row', () => {
    renderNotebookTab()

    const queryCells = Array.from(document.querySelectorAll('[data-slot="explorer-query"]'))
    expect(queryCells).toHaveLength(2)
    queryCells.forEach((cell) => {
      expect(cell).not.toHaveClass('max-w-6xl')
      expect(cell.closest('[style*="max-width"]')).not.toBeNull()
    })

    expect(screen.queryByRole('textbox', { name: 'SQL editor' })).not.toBeInTheDocument()
  })

  it('shows SQL by default for a new notebook', async () => {
    seedNotebook([databaseCell, logCell, markdownCell], 'new')

    renderNotebookTab()

    expect(await screen.findAllByRole('textbox', { name: 'SQL editor' })).toHaveLength(2)
  })

  it('keeps query visibility when the notebook tab remounts', async () => {
    const view = renderNotebookTab()

    const showQueryButton = document.querySelector('.lucide-eye')?.closest('button')
    expect(showQueryButton).toBeInstanceOf(HTMLButtonElement)
    await userEvent.click(showQueryButton as HTMLButtonElement)
    expect(await screen.findAllByRole('textbox', { name: 'SQL editor' })).toHaveLength(1)

    view.unmount()
    renderNotebookTab()

    expect(await screen.findAllByRole('textbox', { name: 'SQL editor' })).toHaveLength(1)
  })

  it('runs every database and log cell, and skips markdown cells, on "Run notebook"', async () => {
    const dbRequests = mockDatabaseQueryRequests()

    const logRequests: Request[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: ({ request }) => {
        logRequests.push(request)
        return HttpResponse.json({ result: [] })
      },
    })

    renderNotebookTab()

    const runNotebookButton = await screen.findByRole('button', { name: 'Run notebook' })
    await waitFor(() => expect(runNotebookButton).toBeEnabled())
    await userEvent.click(runNotebookButton)

    await waitFor(() => expect(dbRequests).toHaveLength(1))
    await waitFor(() => expect(logRequests).toHaveLength(1))
    await waitFor(() => expect(runNotebookButton).toBeEnabled())
    const queryEvents = testContext.track.mock.calls.filter(([action]) =>
      action.startsWith('explorer_query_')
    )
    expect(queryEvents.filter(([action]) => action === 'explorer_query_submitted')).toHaveLength(2)
    expect(queryEvents.filter(([action]) => action === 'explorer_query_completed')).toHaveLength(2)
    for (const [, properties] of queryEvents) {
      expect(properties).toMatchObject({ surface: 'notebook_cell', notebookId: NOTEBOOK_ID })
      expect(properties.cellId).toBeDefined()
      expect(properties).not.toHaveProperty('sql')
    }
    const submittedRuns = queryEvents.filter(([action]) => action === 'explorer_query_submitted')
    const completedRuns = queryEvents.filter(([action]) => action === 'explorer_query_completed')
    expect(new Set(submittedRuns.map(([, properties]) => properties.runId)).size).toBe(2)
    for (const [, properties] of submittedRuns) {
      expect(completedRuns).toContainEqual([
        'explorer_query_completed',
        properties,
        expect.objectContaining({ project: 'default' }),
      ])
    }
  })

  describe('mutation confirmation on "Run notebook"', () => {
    const readOnlyCell = createQueryCellSkeleton({ title: 'Read-only query', sql: 'select 1' })
    const mutatingCell = createQueryCellSkeleton({
      title: 'Mutating query',
      sql: 'delete from foo',
    })

    beforeEach(() => {
      seedNotebook([readOnlyCell, mutatingCell])
    })

    it('runs no cells when the confirmation is cancelled', async () => {
      const queries = mockDatabaseQueryRequests()

      renderNotebookTab()

      await userEvent.click(await screen.findByRole('button', { name: 'Run notebook' }))
      await screen.findByRole('dialog', { name: 'Confirm to run notebook' })

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'Confirm to run notebook' })
        ).not.toBeInTheDocument()
      )
      expect(queries).toHaveLength(0)
    })

    it('labels destructive queries and runs all cells after one confirmation', async () => {
      const queries = mockDatabaseQueryRequests()

      renderNotebookTab()

      await userEvent.click(await screen.findByRole('button', { name: 'Run notebook' }))
      const dialog = await screen.findByRole('dialog', { name: 'Confirm to run notebook' })
      expect(within(dialog).getByText('Mutating query')).toBeInTheDocument()
      expect(within(dialog).getByText('Destructive')).toBeInTheDocument()
      expect(queries).toHaveLength(0)

      await userEvent.click(within(dialog).getByRole('button', { name: 'Run all cells' }))

      await waitFor(() => expect(queries).toHaveLength(2))
      expect(queries.some((query) => query.includes('select 1'))).toBe(true)
      expect(queries.some((query) => query.includes('delete from foo'))).toBe(true)
    })

    it('does not label non-destructive mutations', async () => {
      seedNotebook([
        readOnlyCell,
        createQueryCellSkeleton({
          title: 'Add signup',
          sql: "insert into signups values ('test')",
        }),
      ])
      const queries = mockDatabaseQueryRequests()

      renderNotebookTab()

      await userEvent.click(await screen.findByRole('button', { name: 'Run notebook' }))
      const dialog = await screen.findByRole('dialog', { name: 'Confirm to run notebook' })
      expect(within(dialog).queryByText('Destructive')).not.toBeInTheDocument()

      await userEvent.click(within(dialog).getByRole('button', { name: 'Run all cells' }))

      await waitFor(() => expect(queries).toHaveLength(2))
    })

    it('picks up a SQL commit that lands after this render but before the click handler runs', async () => {
      seedNotebook([readOnlyCell])
      const queries = mockDatabaseQueryRequests()

      renderNotebookTab()

      const runNotebookButton = await screen.findByRole('button', { name: 'Run notebook' })
      await waitFor(() => expect(runNotebookButton).toBeEnabled())

      // Simulates the store commit a Monaco blur performs synchronously right before the
      // click (see QueryCell's onSqlCommit), without letting the resulting re-render reach
      // this component first — the exact race "type mutating SQL, then immediately click
      // Run notebook" hits in the browser.
      notebooksState.updateCell({
        id: NOTEBOOK_ID,
        cellId: readOnlyCell._id,
        updater: (cell) => (isQueryCell(cell) ? setCellSql(cell, 'delete from foo') : cell),
      })
      fireEvent.click(runNotebookButton)

      const dialog = await screen.findByRole('dialog', { name: 'Confirm to run notebook' })
      expect(within(dialog).getByText('Read-only query')).toBeInTheDocument()
      expect(queries).toHaveLength(0)
    })

    it('picks up SQL typed into the live editor buffer that has not yet been committed to the store', async () => {
      seedNotebook([readOnlyCell], 'new')
      const queries = mockDatabaseQueryRequests()

      renderNotebookTab()

      const sqlEditor = await screen.findByRole('textbox', { name: 'SQL editor' })
      fireEvent.change(sqlEditor, { target: { value: 'delete from foo' } })

      // No blur fired, so the store still has the original read-only SQL — the check must
      // read the live buffer directly, not `notebooksState`, to catch this.
      expect(
        notebooksState.notebooks[NOTEBOOK_ID]?.notebook.content?.cells.find(
          (cell) => cell._id === readOnlyCell._id
        )
      ).toMatchObject({ unchecked_sql: 'select 1' })

      const runNotebookButton = screen.getByRole('button', { name: 'Run notebook' })
      await userEvent.click(runNotebookButton)

      const dialog = await screen.findByRole('dialog', { name: 'Confirm to run notebook' })
      expect(within(dialog).getByText('Read-only query')).toBeInTheDocument()
      expect(queries).toHaveLength(0)

      expect(within(dialog).getByText('Destructive')).toBeInTheDocument()
    })

    it('runs only the read-only cells when "Skip these queries" is checked', async () => {
      const queries = mockDatabaseQueryRequests()

      renderNotebookTab()

      await userEvent.click(await screen.findByRole('button', { name: 'Run notebook' }))
      await screen.findByRole('dialog', { name: 'Confirm to run notebook' })

      await userEvent.click(screen.getByRole('checkbox', { name: 'Skip these queries' }))
      await userEvent.click(screen.getByRole('button', { name: 'Run read-only cells' }))

      await waitFor(() => expect(queries).toHaveLength(1))
      expect(queries[0]).toContain('select 1')
      expect(queries.some((query) => query.includes('delete from foo'))).toBe(false)
    })
  })

  it('disables "Run notebook" when the notebook has no database or log cells', async () => {
    seedNotebook([createMarkdownCellSkeleton()])

    renderNotebookTab()

    const runNotebookButton = await screen.findByRole('button', { name: 'Run notebook' })
    expect(runNotebookButton).toBeAriaDisabled()
  })

  it('toggles and persists the Intellisense enabled preference from "More options"', async () => {
    const readPersistedValue = () => {
      const item = safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE)
      return item === null ? true : (JSON.parse(item) as boolean)
    }
    const initialValue = readPersistedValue()

    renderNotebookTab()

    const moreOptionsButton = await screen.findByRole('button', { name: 'More options' })
    await userEvent.click(moreOptionsButton)

    const intellisenseItem = await screen.findByRole('menuitem', { name: 'Intellisense enabled' })
    await userEvent.click(intellisenseItem)

    await waitFor(() => expect(readPersistedValue()).toBe(!initialValue))
  })

  it('persists the preview tab when saving the notebook', async () => {
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () => HttpResponse.json({ id: NOTEBOOK_ID }),
    })

    const tabsState = createTabsState('default')
    const tabId = createTabId('notebook', { id: NOTEBOOK_ID })
    tabsState.addTab({ id: tabId, type: 'notebook', metadata: { notebookId: NOTEBOOK_ID } })
    expect(tabsState.tabsMap[tabId]?.isPreview).toBe(true)

    renderNotebookTab({ tabsState })

    const saveButton = await screen.findByRole('button', { name: 'Save changes' })
    await userEvent.click(saveButton)

    await waitFor(() => expect(tabsState.tabsMap[tabId]?.isPreview).toBe(false))
  })

  it('tracks confirmed creation once and later saves as updates', async () => {
    seedNotebook([databaseCell], 'new')
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () => HttpResponse.json({ id: NOTEBOOK_ID }),
    })

    renderNotebookTab()
    const saveButton = await screen.findByRole('button', { name: 'Save changes' })
    await userEvent.click(saveButton)
    await waitFor(() =>
      expect(testContext.track).toHaveBeenCalledWith(
        'explorer_notebook_created',
        { notebookId: NOTEBOOK_ID },
        { project: 'default' }
      )
    )

    notebooksState.insertCellAfter({ id: NOTEBOOK_ID, cell: createMarkdownCellSkeleton() })
    await userEvent.click(saveButton)
    await waitFor(() =>
      expect(testContext.track).toHaveBeenCalledWith(
        'explorer_notebook_updated',
        { notebookId: NOTEBOOK_ID },
        { project: 'default' }
      )
    )
    expect(
      testContext.track.mock.calls.filter(([action]) => action === 'explorer_notebook_created')
    ).toHaveLength(1)
  })

  it('does not track an unsaved draft or a failed first save', async () => {
    seedNotebook([databaseCell], 'new')
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () => HttpResponse.json({ message: 'Save failed' }, { status: 500 }),
    })

    renderNotebookTab()
    expect(testContext.track).not.toHaveBeenCalled()
    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled())
    expect(
      testContext.track.mock.calls.filter(([action]) => action.startsWith('explorer_notebook_'))
    ).toEqual([])
  })

  it('does not mark a newer edit as saved when an earlier save resolves after it', async () => {
    let resolveSave: (() => void) | undefined
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve
    })
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async () => {
        await savePromise
        return HttpResponse.json({ id: NOTEBOOK_ID })
      },
    })

    renderNotebookTab()

    const saveButton = await screen.findByRole('button', { name: 'Save changes' })
    await userEvent.click(saveButton)
    await waitFor(() => expect(saveButton).toBeDisabled())

    // Edit the notebook while the save request above is still in flight.
    notebooksState.insertCellAfter({ id: NOTEBOOK_ID, cell: createMarkdownCellSkeleton() })
    expect(notebooksState.notebooks[NOTEBOOK_ID]?.status).toBe('unsaved')

    resolveSave?.()
    await waitFor(() => expect(saveButton).toBeEnabled())

    // The in-flight save only persisted the older content, so the notebook must still be
    // considered unsaved rather than clobbered back to 'saved' by the stale response.
    expect(notebooksState.notebooks[NOTEBOOK_ID]?.status).toBe('unsaved')
  })
})

describe('ExplorerNotebookTab — assistant cache invalidation', () => {
  const seedMarkdownNotebook = () =>
    seedNotebook([{ _tag: 'markdown_cell', _id: 'cell-1', text: 'Original content' }])

  /** Seeds a dirty notebook that the server changed (or deleted) underneath it. */
  const seedDivergedNotebook = (type: 'updated' | 'deleted') => {
    seedMarkdownNotebook()
    notebooksState.updateCells({
      id: NOTEBOOK_ID,
      cells: notebooksState.notebooks[NOTEBOOK_ID]!.notebook.content!.cells,
    })
    notebooksState.markServerDivergence({ id: NOTEBOOK_ID, type })
  }

  const mockUpdatedNotebookFetch = () =>
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/item/:id',
      response: () =>
        HttpResponse.json<components['schemas']['GetUserContentByIdResponse_Output']>({
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

  /** Mocks the save endpoint and returns a counter of save requests. */
  const mockSave = (response: () => Response | Promise<Response>) => {
    const saves = { count: 0 }
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () => {
        saves.count += 1
        return response()
      },
    })
    return saves
  }

  const applyAssistantMessage = (
    queryClient: QueryClient,
    message: Parameters<typeof collectNotebookCacheEffects>[0][number]
  ) =>
    applyNotebookCacheEffects({
      queryClient,
      projectRef: PROJECT_REF,
      effects: collectNotebookCacheEffects([message], new Set()),
    })

  beforeEach(() => {
    seedMarkdownNotebook()
  })

  it('refetches and renders the updated cells after an assistant update_notebook tool call completes', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })
    mockUpdatedNotebookFetch()

    renderNotebookTab({ queryClient })

    expect(await screen.findByText('Original content')).toBeInTheDocument()

    await applyAssistantMessage(
      queryClient,
      createAssistantMessageWithUpdateNotebookTool({ id: NOTEBOOK_ID, name: 'Test notebook' })
    )

    expect(await screen.findByText('Updated by assistant')).toBeInTheDocument()
    expect(screen.queryByText('Original content')).not.toBeInTheDocument()
  })

  it('shows the updated cells on remount, when the query cache still holds the pre-eviction notebook', async () => {
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
    mockUpdatedNotebookFetch()

    // While the tab is unmounted (navigated away to a separate Explorer chat tab), the
    // assistant updates the notebook.
    await applyAssistantMessage(
      queryClient,
      createAssistantMessageWithUpdateNotebookTool({ id: NOTEBOOK_ID, name: 'Test notebook' })
    )

    // Simulate navigating back: the notebook tab mounts fresh.
    renderNotebookTab({ queryClient })

    expect(await screen.findByText('Updated by assistant')).toBeInTheDocument()
    expect(screen.queryByText('Original content')).not.toBeInTheDocument()
  })

  it('shows the not-found state after an assistant delete_notebook tool call completes', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content/item/:id',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Notebook not found' }, { status: 404 }),
    })

    renderNotebookTab({ queryClient })

    expect(await screen.findByText('Original content')).toBeInTheDocument()

    await applyAssistantMessage(
      queryClient,
      createAssistantMessageWithDeleteNotebookTool({ id: NOTEBOOK_ID, name: 'Test notebook' })
    )

    expect(await screen.findByText('Notebook not found')).toBeInTheDocument()
    expect(screen.queryByText('Original content')).not.toBeInTheDocument()
  })

  it('saves normally without a conflict dialog when the notebook has not diverged', async () => {
    const saves = mockSave(() => HttpResponse.json({ id: NOTEBOOK_ID }))

    renderNotebookTab()

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(saves.count).toBe(1))
    expect(
      screen.queryByRole('dialog', { name: 'Notebook changed on the server' })
    ).not.toBeInTheDocument()
  })

  it.each([
    {
      type: 'updated' as const,
      description:
        'This notebook changed on the server after your local changes. Saving will overwrite those changes.',
      saveLabel: 'Save anyway',
    },
    {
      type: 'deleted' as const,
      description:
        'This notebook was deleted on the server after your local changes. Saving will recreate it.',
      saveLabel: 'Recreate',
    },
  ])('shows the $type conflict copy before saving', async ({ type, description, saveLabel }) => {
    seedDivergedNotebook(type)

    renderNotebookTab()

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

    const dialog = await screen.findByRole('dialog', { name: 'Notebook changed on the server' })
    expect(dialog).toHaveTextContent(description)
    expect(dialog).toHaveTextContent(saveLabel)
    expect(dialog).toHaveTextContent('Discard changes')
  })

  it('saves exactly once and clears the conflict only after a successful save', async () => {
    seedDivergedNotebook('updated')
    let resolveSave: (() => void) | undefined
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve
    })
    const saves = mockSave(async () => {
      await savePromise
      return HttpResponse.json({ id: NOTEBOOK_ID })
    })

    renderNotebookTab()

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    expect(notebooksState.serverDivergedWhileDirty.get(NOTEBOOK_ID)).toBe('updated')
    await userEvent.click(await screen.findByRole('button', { name: 'Save anyway' }))

    await waitFor(() => expect(saves.count).toBe(1))
    expect(notebooksState.serverDivergedWhileDirty.get(NOTEBOOK_ID)).toBe('updated')
    resolveSave?.()
    await waitFor(() =>
      expect(notebooksState.serverDivergedWhileDirty.has(NOTEBOOK_ID)).toBe(false)
    )
  })

  it('keeps the conflict marker when saving anyway fails', async () => {
    seedDivergedNotebook('updated')
    const saves = mockSave(() => HttpResponse.json({ message: 'Save failed' }, { status: 500 }))

    renderNotebookTab()

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Save anyway' }))

    await waitFor(() => expect(saves.count).toBe(1))
    expect(notebooksState.serverDivergedWhileDirty.get(NOTEBOOK_ID)).toBe('updated')
  })

  it('omits existing cell IDs when saving anyway recreates an assistant-deleted notebook', async () => {
    seedDivergedNotebook('deleted')
    let sentBody: Record<string, unknown> | undefined
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: NOTEBOOK_ID })
      },
    })

    renderNotebookTab()

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Recreate' }))

    await waitFor(() => expect(sentBody).toBeDefined())
    const content = sentBody?.content as { cells: Array<Record<string, unknown>> }
    content.cells.forEach((cell) => expect(cell).not.toHaveProperty('_id'))
  })

  it('discards local changes without mutating and evicts the conflicted notebook', async () => {
    seedDivergedNotebook('updated')
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })
    const saves = mockSave(() => HttpResponse.json({ id: NOTEBOOK_ID }))

    renderNotebookTab({ queryClient })

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }))

    await waitFor(() => expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeUndefined())
    expect(notebooksState.serverDivergedWhileDirty.has(NOTEBOOK_ID)).toBe(false)
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))).toBeUndefined()
    expect(saves.count).toBe(0)
  })

  it('closes the notebook tab when discarding edits after an assistant deletion', async () => {
    seedDivergedNotebook('deleted')
    const tabsState = createTabsState(PROJECT_REF)
    const tabId = createTabId('notebook', { id: NOTEBOOK_ID })
    tabsState.addTab({ id: tabId, type: 'notebook', metadata: { notebookId: NOTEBOOK_ID } })

    renderNotebookTab({ tabsState })

    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }))

    await waitFor(() => expect(tabsState.tabsMap[tabId]).toBeUndefined())
  })

  it.each(['the close button', 'the backdrop'])(
    'dismisses the conflict with %s without changing notebook state',
    async (dismissal) => {
      seedDivergedNotebook('updated')

      renderNotebookTab()

      await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
      const dialog = await screen.findByRole('dialog', { name: 'Notebook changed on the server' })
      if (dismissal === 'the close button') {
        await userEvent.click(screen.getByRole('button', { name: 'Close' }))
      } else {
        fireEvent.pointerDown(dialog.parentElement!, { button: 0, ctrlKey: false })
      }

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'Notebook changed on the server' })
        ).not.toBeInTheDocument()
      )
      expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeDefined()
      expect(notebooksState.serverDivergedWhileDirty.get(NOTEBOOK_ID)).toBe('updated')
    }
  )
})

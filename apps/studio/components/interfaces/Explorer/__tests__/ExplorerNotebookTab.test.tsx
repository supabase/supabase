import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerNotebookTab } from '../ExplorerNotebookTab'
import { setCellSql } from '../QueryCell/QueryCell.utils'
import { createMarkdownCellSkeleton, createQueryCellSkeleton } from '../utils'
import { isQueryCell } from '@/data/content/notebooks/notebook-schema'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'
import { createTabId, createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'
import type { Notebooks } from '@/types'

const testContext = vi.hoisted(() => ({
  flags: { otelLegacyLogs: true } as Record<string, boolean>,
}))

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

vi.mock('../MarkdownEditor', async () => {
  const { forwardRef } = await import('react')

  return {
    MarkdownEditor: forwardRef<
      HTMLTextAreaElement,
      {
        markdown: string
        onChange?: (markdown: string, initialMarkdownNormalize: boolean) => void
        placeholder?: React.ReactNode
        contentEditableClassName?: string
      }
    >(({ markdown, onChange, placeholder, contentEditableClassName }, ref) => (
      <textarea
        ref={ref}
        aria-label="Markdown editor"
        className={contentEditableClassName}
        defaultValue={markdown}
        placeholder={typeof placeholder === 'string' ? placeholder : undefined}
        onChange={(event) => onChange?.(event.target.value, false)}
      />
    )),
  }
})

vi.mock('../QueryEditor/QuerySourceMenu', () => ({
  QuerySourceMenu: () => null,
}))

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

const renderNotebookTab = (tabsState = createTabsState('default')) =>
  customRender(
    <TabsStateContext.Provider value={tabsState}>
      <ExplorerNotebookTab />
    </TabsStateContext.Provider>
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
  safeLocalStorage.removeItem(LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE)
})

describe('ExplorerNotebookTab', () => {
  it('edits markdown inline and leaves persistence to the notebook save action', async () => {
    const cell = createMarkdownCellSkeleton({ content: 'Original note' })
    seedNotebook([cell])

    renderNotebookTab()

    const editor = await screen.findByRole('textbox', { name: 'Markdown editor' })
    expect(editor).toHaveValue('Original note')
    expect(editor).toHaveClass('focus:outline-none')
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()

    await userEvent.clear(editor)
    await userEvent.type(editor, '# Updated note')

    expect(notebooksState.notebooks[NOTEBOOK_ID].notebook.content?.cells[0]).toEqual(
      expect.objectContaining({ _id: cell._id, text: '# Updated note' })
    )
    expect(notebooksState.notebooks[NOTEBOOK_ID].status).toBe('unsaved')
  })

  it('hides SQL by default for saved notebooks and caps query cells at 6xl', () => {
    renderNotebookTab()

    const queryCells = Array.from(document.querySelectorAll('[data-slot="explorer-query"]'))
    expect(queryCells).toHaveLength(2)
    queryCells.forEach((cell) => expect(cell).toHaveClass('max-w-6xl'))

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

    it('opens a confirmation modal instead of running immediately when a cell mutates data', async () => {
      const queries = mockDatabaseQueryRequests()

      renderNotebookTab()

      await userEvent.click(await screen.findByRole('button', { name: 'Run notebook' }))

      const dialog = await screen.findByRole('dialog', { name: 'Confirm to run notebook' })
      expect(within(dialog).getByText('Mutating query')).toBeInTheDocument()
      expect(queries).toHaveLength(0)
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

    it('runs every cell, including the mutating one, when confirmed with "Run all cells"', async () => {
      const queries = mockDatabaseQueryRequests()

      renderNotebookTab()

      await userEvent.click(await screen.findByRole('button', { name: 'Run notebook' }))
      await screen.findByRole('dialog', { name: 'Confirm to run notebook' })

      await userEvent.click(screen.getByRole('button', { name: 'Run all cells' }))

      await waitFor(() => expect(queries).toHaveLength(2))
      expect(queries.some((query) => query.includes('select 1'))).toBe(true)
      expect(queries.some((query) => query.includes('delete from foo'))).toBe(true)
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
    expect(runNotebookButton).toBeDisabled()
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

    renderNotebookTab(tabsState)

    const saveButton = await screen.findByRole('button', { name: 'Save changes' })
    await userEvent.click(saveButton)

    await waitFor(() => expect(tabsState.tabsMap[tabId]?.isPreview).toBe(false))
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

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerNotebookTab } from '../ExplorerNotebookTab'
import { createMarkdownCellSkeleton, createQueryCellSkeleton } from '../utils'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'
import { createTabsState, TabsStateContext } from '@/state/tabs'
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
  CodeEditor: ({ value }: { value: string }) => (
    <textarea aria-label="SQL editor" value={value} readOnly />
  ),
}))

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

const renderNotebookTab = () =>
  customRender(
    <TabsStateContext.Provider value={createTabsState('default')}>
      <ExplorerNotebookTab />
    </TabsStateContext.Provider>
  )

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
    // `useAddDefinitions` fires its own background keywords/functions/schemas/table-columns
    // fetches against this same generic pg-meta query endpoint (differentiated by the `key`
    // search param) as soon as a database cell's editor mounts, and `QueryEditor` runs an
    // event-trigger lookup for `analyzeQueryIssues` — both are expected and unrelated to the
    // actual cell run.
    const INTELLISENSE_KEYS = ['keywords', 'database-functions', 'schemas', 'table-columns']
    const dbRequests: Request[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')
        const { query } = (await request.clone().json()) as { query?: string }
        const isIntellisenseRequest = !!key && INTELLISENSE_KEYS.includes(key)
        const isEventTriggerRequest = !!query?.includes('pg_event_trigger')
        if (!isIntellisenseRequest && !isEventTriggerRequest) dbRequests.push(request)
        return HttpResponse.json([{ result: 1 }])
      },
    })

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
})

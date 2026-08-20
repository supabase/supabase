import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerNotebookTab } from '../ExplorerNotebookTab'
import { createMarkdownCellSkeleton, createQueryCellSkeleton } from '../utils'
import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook, StateNotebook } from '@/state/notebooks/types'
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

/**
 * Assigns directly into the store rather than going through `setNotebook` — that helper
 * no-ops when a notebook with content already exists, which would make reseeding between
 * tests (or within one, for the empty-notebook case) silently keep the previous cells.
 */
const seedNotebook = (cells: Notebooks.Cell[]) => {
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
  const stateNotebook: StateNotebook = { projectRef: 'default', notebook, status: 'saved' }
  notebooksState.notebooks[NOTEBOOK_ID] = stateNotebook
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

afterEach(() => notebooksState.needsSaving.clear())

describe('ExplorerNotebookTab', () => {
  it('runs every database and log cell, and skips markdown cells, on "Run notebook"', async () => {
    const dbRequests: Request[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        dbRequests.push(request)
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
})

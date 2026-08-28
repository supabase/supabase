import { acceptUntrustedSql, untrustedSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSqlEditorExecution } from './useSqlEditorExecution'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { createDatabaseSelectorState } from '@/state/database-selector'
import { sqlEditorSessionState } from '@/state/sql-editor/sql-editor-session-state'
import { addAPIMock } from '@/tests/lib/msw'
import {
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
  setupSqlEditorMocks,
} from '@/tests/lib/sql-editor-test-utils'

const SNIPPET_ID = 'execution-snippet'

/** Promote raw text to the `SafeSqlFragment` the run pipeline expects, exactly
 *  as the toolbar/editor-panel promote it right at the user action. */
const sql = (text: string): SafeSqlFragment => acceptUntrustedSql(untrustedSql(text))

type ExecutionArgs = Parameters<typeof useSqlEditorExecution>[0]

/**
 * Wraps the hook with the two queries it depends on so tests can wait for the
 * project + read-replicas data to load before firing a run (an unloaded project
 * or connection string silently short-circuits `executeQuery`).
 */
function useExecutionHarness(args: ExecutionArgs) {
  const { data: project } = useSelectedProjectQuery()
  const { data: databases } = useReadReplicasQuery({ projectRef: 'default' })
  const execution = useSqlEditorExecution(args)
  return { execution, isReady: !!project && !!databases }
}

/** Registers a query-endpoint resolver that records every executed SQL body. */
function captureExecutedQueries(rows: unknown[] = []) {
  const queries: string[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const body = (await request.json()) as { query: string }
      queries.push(body.query)
      return HttpResponse.json<any>(rows)
    },
  })
  return queries
}

function renderExecution(
  args: Partial<ExecutionArgs> = {},
  { selectedDatabaseId = 'default' }: { selectedDatabaseId?: string } = {}
) {
  const databaseSelectorState = createDatabaseSelectorState()
  databaseSelectorState.setSelectedDatabaseId(selectedDatabaseId)

  const setAiTitle = vi.fn()
  const initialProps: ExecutionArgs = {
    id: SNIPPET_ID,
    isDiffOpen: false,
    hasSelection: false,
    setAiTitle,
    ...args,
  }

  const utils = renderSqlEditorHook((props: ExecutionArgs) => useExecutionHarness(props), {
    initialProps,
    databaseSelectorState,
  })

  return { ...utils, setAiTitle }
}

beforeEach(() => {
  resetSqlEditorStores()
  setupSqlEditorMocks()
  seedSnippet({ id: SNIPPET_ID, name: 'My query', sql: 'select 1;' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useSqlEditorExecution', () => {
  it('runs a non-destructive query and writes the result to the session store', async () => {
    const rows = [{ id: 1, name: 'row-1' }]
    const queries = captureExecutedQueries(rows)

    const { result } = renderExecution()
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.execution.executeQuery(sql('select 1'))
    })

    await waitFor(() => expect(sqlEditorSessionState.results[SNIPPET_ID]).toBeDefined())
    expect(sqlEditorSessionState.results[SNIPPET_ID][0].rows).toEqual(rows)
    expect(queries.some((q) => /select 1/i.test(q))).toBe(true)
  })

  it('appends the auto-limit to a bare SELECT and records it on the result', async () => {
    const queries = captureExecutedQueries([])

    const { result } = renderExecution()
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.execution.executeQuery(sql('select 1'))
    })

    await waitFor(() => expect(sqlEditorSessionState.results[SNIPPET_ID]).toBeDefined())
    // The session store's `limit` defaults to 100 (see resetSqlEditorStores).
    expect(sqlEditorSessionState.results[SNIPPET_ID][0].autoLimit).toBe(100)
    expect(queries.some((q) => /limit 100/i.test(q))).toBe(true)
  })

  it('gates a destructive query behind potentialIssues instead of running it', async () => {
    const queries = captureExecutedQueries([])

    const { result } = renderExecution()
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.execution.executeQuery(sql('drop table foo;'))
    })

    // The warning-modal gate fired: issues are surfaced and nothing was executed.
    await waitFor(() => expect(result.current.execution.potentialIssues).toBeDefined())
    expect(result.current.execution.potentialIssues?.hasDestructiveOperations).toBe(true)
    expect(queries.some((q) => /drop table foo/i.test(q))).toBe(false)
    expect(sqlEditorSessionState.results[SNIPPET_ID]).toBeUndefined()
  })

  it('runs a destructive query when forced', async () => {
    const queries = captureExecutedQueries([])

    const { result } = renderExecution()
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.execution.executeQuery(sql('drop table foo;'), true)
    })

    await waitFor(() => expect(queries.some((q) => /drop table foo/i.test(q))).toBe(true))
    await waitFor(() => expect(sqlEditorSessionState.results[SNIPPET_ID]).toBeDefined())
  })

  it('highlights the error line and records the error on failure', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const body = (await request.json()) as { query: string }
        // The event-triggers probe shares this endpoint; only fail the real run.
        if (/select 1/i.test(body.query)) {
          return HttpResponse.json<any>(
            {
              message: 'syntax error',
              position: '8',
              formattedError:
                'ERROR:  syntax error at or near "slect"\nLINE 3: slect 1;\n        ^',
            },
            { status: 400 }
          )
        }
        return HttpResponse.json<any>([])
      },
    })

    const { result, inMemoryEditor } = renderExecution()
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.execution.executeQuery(sql('select 1'))
    })

    await waitFor(() => expect(sqlEditorSessionState.results[SNIPPET_ID]?.[0].error).toBeDefined())
    // No selection → base line 0 + parsed `LINE 3` = 3.
    expect(inMemoryEditor.getHighlightedLine()).toBe(3)
    expect(inMemoryEditor.getRevealedLine()).toBe(3)
  })

  it("sends the selected database's connection string as the connection header", async () => {
    const connectionString = 'postgresql://postgres@replica.example:5432/postgres'
    const connectionHeaders: (string | null)[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const body = (await request.json()) as { query: string }
        if (/select 1/i.test(body.query)) {
          connectionHeaders.push(request.headers.get('x-connection-encrypted'))
        }
        return HttpResponse.json<any>([])
      },
    })

    // Point the read-replicas list + selector at a replica with its own conn string.
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/databases',
      response: [
        {
          identifier: 'replica-1',
          connectionString,
          cloud_provider: 'AWS',
          db_host: 'db.replica.supabase.co',
          db_name: 'postgres',
          db_port: 5432,
          db_user: 'postgres',
          inserted_at: '2024-01-01T00:00:00Z',
          region: 'us-east-1',
          restUrl: 'https://replica.supabase.co/rest/v1/',
          size: 'ci_micro',
          status: 'ACTIVE_HEALTHY',
        },
      ],
    })

    const { result } = renderExecution({}, { selectedDatabaseId: 'replica-1' })
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.execution.executeQuery(sql('select 1'))
    })

    await waitFor(() => expect(connectionHeaders.length).toBeGreaterThan(0))
    expect(connectionHeaders[0]).toBe(connectionString)
  })

  it('short-circuits while a diff is open', async () => {
    const queries = captureExecutedQueries([])

    const { result } = renderExecution({ isDiffOpen: true })
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.execution.executeQuery(sql('select 1'))
    })

    await new Promise((r) => setTimeout(r, 20))
    expect(queries.some((q) => /select 1/i.test(q))).toBe(false)
    expect(sqlEditorSessionState.results[SNIPPET_ID]).toBeUndefined()
  })

  it('does not auto-generate a title for an already-named snippet', async () => {
    captureExecutedQueries([])

    const { result, setAiTitle } = renderExecution()
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.execution.executeQuery(sql('select 1'))
    })

    await waitFor(() => expect(sqlEditorSessionState.results[SNIPPET_ID]).toBeDefined())
    expect(setAiTitle).not.toHaveBeenCalled()
  })
})

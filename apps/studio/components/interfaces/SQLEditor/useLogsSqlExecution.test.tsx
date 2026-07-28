import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLogsSqlExecution } from './useLogsSqlExecution'
import {
  acceptUntrustedLogsSql,
  untrustedLogSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'
import { sqlEditorSessionState } from '@/state/sql-editor/sql-editor-session-state'
import { addAPIMock } from '@/tests/lib/msw'
import {
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
  setupSqlEditorMocks,
} from '@/tests/lib/sql-editor-test-utils'

const SNIPPET_ID = 'logs-execution-snippet'

/** Promote raw text to the `SafeLogSqlFragment` the run pipeline expects, exactly
 *  as the toolbar/editor-panel promote it right at the user action. */
const logsSql = (text: string): SafeLogSqlFragment => acceptUntrustedLogsSql(untrustedLogSql(text))

type CapturedBody = { sql: string; iso_timestamp_start: string; iso_timestamp_end: string }

function mockLogsAllOtel(rows: unknown[] = []) {
  const captured: CapturedBody[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    response: async ({ request }) => {
      const body = (await request.json()) as CapturedBody
      captured.push(body)
      return HttpResponse.json<any>({ result: rows })
    },
  })
  return captured
}

/** Renders the hook with ClickHouse logs enabled by default; pass
 *  `{ otelLegacyLogs: false }` to exercise the not-available-yet guard. */
function renderLogsExecution(flags: Record<string, boolean> = { otelLegacyLogs: true }) {
  return renderSqlEditorHook(() => useLogsSqlExecution({ id: SNIPPET_ID }), { flags })
}

beforeEach(() => {
  resetSqlEditorStores()
  setupSqlEditorMocks()
  seedSnippet({ id: SNIPPET_ID, source: 'logs' })
})

describe('useLogsSqlExecution', () => {
  it('runs a logs query and writes the result to the session store', async () => {
    const rows = [{ event_message: 'hello' }]
    const captured = mockLogsAllOtel(rows)

    const { result } = renderLogsExecution()

    act(() => {
      result.current.executeLogsQuery(logsSql('select event_message from edge_logs'))
    })

    await waitFor(() => expect(sqlEditorSessionState.results[SNIPPET_ID]).toBeDefined())
    expect(sqlEditorSessionState.results[SNIPPET_ID][0].rows).toEqual(rows)

    expect(captured).toHaveLength(1)
    expect(captured[0].sql).toContain('select event_message from edge_logs')
    expect(captured[0].iso_timestamp_start.length).toBeGreaterThan(0)
    expect(captured[0].iso_timestamp_end.length).toBeGreaterThan(0)
  })

  it('records a structured 200-body error on the result instead of throwing', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async () =>
        HttpResponse.json<any>({
          error: {
            code: 400,
            errors: [{ domain: 'global', message: 'Missing column', reason: 'invalid' }],
            message: 'Missing column',
            status: 'INVALID_ARGUMENT',
          },
        }),
    })

    const { result } = renderLogsExecution()

    act(() => {
      result.current.executeLogsQuery(logsSql('select does_not_exist from edge_logs'))
    })

    await waitFor(() => expect(sqlEditorSessionState.results[SNIPPET_ID]?.[0]?.error).toBeDefined())
    expect(sqlEditorSessionState.results[SNIPPET_ID][0].error.message).toBe('Missing column')
  })

  it('resolves a relative session range to a from/to window around now', async () => {
    const captured = mockLogsAllOtel([])
    sqlEditorSessionState.setLogRange(SNIPPET_ID, {
      kind: 'relative',
      last: { amount: 2, unit: 'hour' },
    })

    const { result } = renderLogsExecution()

    act(() => {
      result.current.executeLogsQuery(logsSql('select 1'))
    })

    await waitFor(() => expect(captured).toHaveLength(1))
    const from = Date.parse(captured[0].iso_timestamp_start)
    const to = Date.parse(captured[0].iso_timestamp_end)
    expect(Number.isNaN(from)).toBe(false)
    expect(Number.isNaN(to)).toBe(false)
    expect(from).toBeLessThan(to)
  })

  it('records an unavailable message and fires no request when ClickHouse logs are off', async () => {
    const captured = mockLogsAllOtel([])

    const { result } = renderLogsExecution({ otelLegacyLogs: false })

    act(() => {
      result.current.executeLogsQuery(logsSql('select 1'))
    })

    await waitFor(() => expect(sqlEditorSessionState.results[SNIPPET_ID]?.[0]?.error).toBeDefined())
    expect(sqlEditorSessionState.results[SNIPPET_ID][0].error.message).toBe(
      "Querying logs from the SQL editor isn't available for this project yet."
    )
    // The doomed request never left the client.
    expect(captured).toHaveLength(0)
  })
})

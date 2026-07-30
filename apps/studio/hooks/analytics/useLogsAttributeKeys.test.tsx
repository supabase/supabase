import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { SOURCE_DETECTION_DEBOUNCE_MS, useLogsAttributeKeys } from './useLogsAttributeKeys'
import { addAPIMock } from '@/tests/lib/msw'
import { renderSqlEditorHook, setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'

const OTEL_ENDPOINT = '/platform/projects/:ref/analytics/endpoints/logs.all.otel'

const queryFor = (source: string) => `select 1 from logs where source = '${source}'`

/** Records the SQL of every key-discovery request so we can count them. */
function mockKeyDiscovery() {
  const requests: string[] = []
  addAPIMock({
    method: 'post',
    path: OTEL_ENDPOINT,
    response: async ({ request }) => {
      const body = (await request.clone().json()) as { sql: string }
      requests.push(body.sql)
      return HttpResponse.json({ result: [{ key: 'request.method' }] })
    },
  })
  return requests
}

/** Waits out the debounce plus a margin, so late requests are counted too. */
const settle = () => new Promise((r) => setTimeout(r, SOURCE_DETECTION_DEBOUNCE_MS + 100))

beforeEach(() => {
  setupSqlEditorMocks()
})

describe('useLogsAttributeKeys', () => {
  it('returns the discovered keys for the query source', async () => {
    const requests = mockKeyDiscovery()

    const { result } = renderSqlEditorHook(useLogsAttributeKeys, {
      initialProps: { sql: queryFor('edge_logs'), enabled: true },
    })

    await waitFor(() => expect(result.current).toEqual(['request.method']))
    // An already-open snippet discovers keys immediately — no debounce wait.
    expect(requests[0]).toContain("source = 'edge_logs'")
  })

  it('makes no request when disabled', async () => {
    const requests = mockKeyDiscovery()

    renderSqlEditorHook(useLogsAttributeKeys, {
      initialProps: { sql: queryFor('edge_logs'), enabled: false },
    })

    await settle()
    expect(requests).toHaveLength(0)
  })

  it('makes no request for a query with no detectable source', async () => {
    const requests = mockKeyDiscovery()

    renderSqlEditorHook(useLogsAttributeKeys, {
      initialProps: { sql: 'select 1 from logs limit 5', enabled: true },
    })

    await settle()
    expect(requests).toHaveLength(0)
  })

  it('collapses a burst of keystrokes into a single request for the final source', async () => {
    const requests = mockKeyDiscovery()

    const { rerender } = renderSqlEditorHook(useLogsAttributeKeys, {
      initialProps: { sql: queryFor('edge_logs'), enabled: true },
    })
    await waitFor(() => expect(requests).toHaveLength(1))

    // Retype the source. Every intermediate value detects a *different* source, and
    // the source is part of the React Query key — undebounced, each keystroke would
    // be its own analytics request.
    for (const partial of ['p', 'po', 'pos', 'post', 'postgres', 'postgres_logs']) {
      rerender({ sql: queryFor(partial), enabled: true })
    }

    await settle()

    expect(requests).toHaveLength(2)
    expect(requests[1]).toContain("source = 'postgres_logs'")
  })
})

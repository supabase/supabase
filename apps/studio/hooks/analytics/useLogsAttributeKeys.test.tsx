import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLogsAttributeKeys } from './useLogsAttributeKeys'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { addAPIMock } from '@/tests/lib/msw'
import { renderSqlEditorHook, setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'

const OTEL_ENDPOINT = '/platform/projects/:ref/analytics/endpoints/logs.all.otel'

const queryFor = (source: string) => `select 1 from logs where source = '${source}'`

/** Records the SQL of every key-discovery request so we can count them. */
function mockKeyDiscovery({ fails = false }: { fails?: boolean } = {}) {
  const requests: string[] = []
  addAPIMock({
    method: 'post',
    path: OTEL_ENDPOINT,
    response: async ({ request }) => {
      const body = (await request.clone().json()) as { sql: string }
      requests.push(body.sql)
      if (fails) return HttpResponse.json({ message: 'boom' }, { status: 500 })
      return HttpResponse.json({ result: [{ key: 'request.method' }] })
    },
  })
  return requests
}

/**
 * Exposes the resolved project alongside the hook. Discovery needs a project ref,
 * so tests must wait for that query before asking — otherwise a lookup no-ops and
 * the request counts below would pass for the wrong reason.
 */
function useKeysHarness() {
  const { data: project } = useSelectedProjectQuery()
  const { fetchAttributeKeys } = useLogsAttributeKeys()
  return { projectRef: project?.ref, fetchAttributeKeys }
}

async function renderReadyHarness() {
  const utils = renderSqlEditorHook(useKeysHarness)
  await waitFor(() => expect(utils.result.current.projectRef).toBe('default'))
  return utils
}

beforeEach(() => {
  setupSqlEditorMocks()
})

describe('useLogsAttributeKeys', () => {
  it('makes no request until asked', async () => {
    const requests = mockKeyDiscovery()

    await renderReadyHarness()

    expect(requests).toHaveLength(0)
  })

  it('returns the discovered keys for the query source when asked', async () => {
    const requests = mockKeyDiscovery()
    const { result } = await renderReadyHarness()

    let keys: string[] | undefined
    await act(async () => {
      keys = await result.current.fetchAttributeKeys(queryFor('edge_logs'))
    })

    expect(keys).toEqual(['request.method'])
    expect(requests).toHaveLength(1)
    expect(requests[0]).toContain("source = 'edge_logs'")
  })

  it('reuses the cached result for a source already looked up', async () => {
    const requests = mockKeyDiscovery()
    const { result } = await renderReadyHarness()

    await act(async () => {
      await result.current.fetchAttributeKeys(queryFor('edge_logs'))
      await result.current.fetchAttributeKeys(queryFor('edge_logs'))
    })

    expect(requests).toHaveLength(1)
  })

  it('looks up a different source separately', async () => {
    const requests = mockKeyDiscovery()
    const { result } = await renderReadyHarness()

    await act(async () => {
      await result.current.fetchAttributeKeys(queryFor('edge_logs'))
      await result.current.fetchAttributeKeys(queryFor('postgres_logs'))
    })

    expect(requests).toHaveLength(2)
    expect(requests[1]).toContain("source = 'postgres_logs'")
  })

  it('resolves undefined without a request when no source is detectable', async () => {
    const requests = mockKeyDiscovery()
    const { result } = await renderReadyHarness()

    let keys: string[] | undefined
    await act(async () => {
      keys = await result.current.fetchAttributeKeys('select 1 from logs limit 5')
    })

    expect(keys).toBeUndefined()
    expect(requests).toHaveLength(0)
  })

  it('resolves undefined rather than throwing when discovery fails', async () => {
    mockKeyDiscovery({ fails: true })
    const { result } = await renderReadyHarness()

    let keys: string[] | undefined
    await act(async () => {
      keys = await result.current.fetchAttributeKeys(queryFor('edge_logs'))
    })

    // Keys are an enhancement — a failed lookup must not block the caller.
    expect(keys).toBeUndefined()
  })
})

import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
import { subscribe } from 'valtio'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSqlEditorDatabaseSelection } from './useSqlEditorDatabaseSelection'
import { replicaKeys } from '@/data/read-replicas/keys'
import { useReadReplicasQuery, type Database } from '@/data/read-replicas/replicas-query'
import {
  createDatabaseSelectorState,
  useDatabaseSelectorStateSnapshot,
} from '@/state/database-selector'
import { addAPIMock } from '@/tests/lib/msw'
import {
  renderSqlEditorHook,
  resetSqlEditorStores,
  setupSqlEditorMocks,
} from '@/tests/lib/sql-editor-test-utils'

const REF = 'default'
const CONNECTION_STRING = 'postgresql://postgres@localhost:5432/postgres'

function useHarness() {
  useSqlEditorDatabaseSelection({ ref: REF, connectionString: CONNECTION_STRING })
  const { selectedDatabaseId } = useDatabaseSelectorStateSnapshot()
  // Shares the query cache with the hook under test, purely so the test can
  // observe when a refetch has actually reached this render (see below).
  const { data: databases } = useReadReplicasQuery({ projectRef: REF })
  return { selectedDatabaseId, databases }
}

function buildDatabase(identifier: string, requestCount = 1): Database {
  return {
    identifier,
    connectionString: CONNECTION_STRING,
    connection_string_read_only: CONNECTION_STRING,
    cloud_provider: 'AWS',
    db_host: `db.${identifier}.supabase.co`,
    db_name: 'postgres',
    db_port: 5432,
    db_user: 'postgres',
    inserted_at: `2024-01-01T00:00:${String(requestCount).padStart(2, '0')}Z`,
    region: 'us-east-1',
    restUrl: `https://${identifier}.supabase.co/rest/v1/`,
    size: 'ci_micro',
    status: 'ACTIVE_HEALTHY',
  }
}

/**
 * Overrides the default single-database mock from `setupSqlEditorMocks` with a
 * primary + replica, and varies a field (as a real background poll would, e.g.
 * timestamps) on every request so react-query's structural sharing can't reuse
 * the previous array reference — otherwise the effect this hook guards would
 * never even re-run, masking the clobbering bug regardless of the guard.
 */
function mockDatabasesWithReplica() {
  let requestCount = 0
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/databases',
    response: () => {
      requestCount += 1
      return HttpResponse.json<Database[]>(
        [REF, 'replica-1'].map((identifier) => buildDatabase(identifier, requestCount))
      )
    },
  })
}

beforeEach(() => {
  resetSqlEditorStores()
  setupSqlEditorMocks({ ref: REF, connectionString: CONNECTION_STRING })
  localStorage.clear()
})

describe('useSqlEditorDatabaseSelection', () => {
  it('defaults to the primary database once read replicas load', async () => {
    const { result } = renderSqlEditorHook(() => useHarness())

    await waitFor(() => expect(result.current.selectedDatabaseId).toBe(REF))
  })

  it('does not clobber an existing selection when the databases list is refetched', async () => {
    // This is the regression this hook exists to prevent: a background refetch
    // of `databases` used to re-run the selection effect and silently swap the
    // user's chosen replica back to the primary.
    mockDatabasesWithReplica()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const databaseSelectorState = createDatabaseSelectorState()

    const { result } = renderSqlEditorHook(() => useHarness(), {
      queryClient,
      databaseSelectorState,
    })

    await waitFor(() => expect(result.current.selectedDatabaseId).toBe(REF))

    await act(async () => {
      databaseSelectorState.setSelectedDatabaseId('replica-1')
    })
    await waitFor(() => expect(result.current.selectedDatabaseId).toBe('replica-1'))

    await act(async () => {
      await queryClient.refetchQueries({ queryKey: replicaKeys.list(REF) })
    })

    // Wait until the refetched (differently-timestamped) data has actually
    // reached this render, so the assertion below isn't just "too early" —
    // if the guard were broken, this is the point at which it would clobber.
    await waitFor(() => expect(result.current.databases?.[0].inserted_at).toMatch(/:02Z$/))

    expect(result.current.selectedDatabaseId).toBe('replica-1')
  })

  it('waits for the persisted last-selected database to load before defaulting to the primary', async () => {
    // Regression: if `databases` is already cached/fresh (isSuccess synchronously
    // true) while the local-storage read is still in flight, the effect used to
    // fire immediately, default to the primary, and then the "only once" guard
    // blocked the persisted replica choice from ever being applied once it loaded.
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_SELECTED_DB(REF),
      JSON.stringify('replica-1')
    )
    // Also mock the endpoint (not just the cache) so a refetch-on-mount — triggered
    // because seeded data via `setQueryData` is immediately stale — doesn't clobber
    // the seeded replica with the default single-database response.
    mockDatabasesWithReplica()

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(replicaKeys.list(REF), [
      buildDatabase(REF),
      buildDatabase('replica-1'),
    ])

    const databaseSelectorState = createDatabaseSelectorState()
    const selectionsSeen: (string | undefined)[] = []
    subscribe(databaseSelectorState, () =>
      selectionsSeen.push(databaseSelectorState.selectedDatabaseId)
    )

    const { result } = renderSqlEditorHook(() => useHarness(), {
      queryClient,
      databaseSelectorState,
    })

    await waitFor(() => expect(result.current.selectedDatabaseId).toBe('replica-1'))

    expect(selectionsSeen).not.toContain(REF)
  })
})

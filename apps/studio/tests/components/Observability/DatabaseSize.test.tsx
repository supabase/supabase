import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { Button } from 'ui'
import { describe, expect, it } from 'vitest'

import { DatabaseSize } from '@/components/interfaces/Observability/DatabaseSize/DatabaseSize'
import type { components } from '@/data/api'
import { databaseKeys } from '@/data/database/keys'
import { projectKeys } from '@/data/projects/keys'
import {
  createDatabaseSelectorState,
  DatabaseSelectorStateContext,
} from '@/state/database-selector'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const primaryConnection = 'postgresql://postgres:password@db.primary.example:5432/postgres'
const replicaConnection = 'postgresql://postgres:password@db.replica.example:5432/postgres'
const project: components['schemas']['ProjectDetailResponse_Output'] = {
  cloud_provider: 'AWS',
  connectionString: primaryConnection,
  db_host: 'db.primary.example',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Test',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'sub',
  updated_at: '2026-01-01T00:00:00.000Z',
  volumeSizeGb: 8,
}
const replica: components['schemas']['DatabaseDetailResponse_Output'] = {
  cloud_provider: 'AWS',
  connectionString: replicaConnection,
  connection_string_read_only: replicaConnection,
  db_host: 'db.replica.example',
  db_name: 'postgres',
  db_port: 5432,
  db_user: 'postgres',
  identifier: 'replica',
  inserted_at: '2026-01-01T00:00:00.000Z',
  region: 'us-east-1',
  restUrl: 'https://replica.supabase.co',
  size: 't4g.small',
  status: 'ACTIVE_HEALTHY',
}

function renderSize(selectedDatabaseId = 'replica') {
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: project })
  const state = createDatabaseSelectorState()
  state.setSelectedDatabaseId(selectedDatabaseId)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  customRender(
    <DatabaseSelectorStateContext.Provider value={state}>
      <DatabaseSize
        diskAction={<Button>Increase disk size</Button>}
        updateDateRange={() => undefined}
      />
    </DatabaseSelectorStateContext.Provider>,
    { queryClient }
  )
  return { state, queryClient }
}

function mockSnapshot() {
  const connections: (string | null)[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: ({ request }) => {
      const connection = request.headers.get('x-connection-encrypted')
      connections.push(connection)
      const name = connection === replicaConnection ? 'replica_table' : 'primary_table'
      return HttpResponse.json<unknown[]>([
        {
          database_name: 'postgres',
          database_bytes: '2000',
          instance_bytes: '4000',
          relations: [
            {
              id: '1',
              name,
              schema: 'public',
              table_bytes: '1000',
              index_bytes: '0',
              toast_bytes: '0',
              indexes: [],
            },
          ],
        },
      ])
    },
  })
  return connections
}

describe('database size selected instance', () => {
  it('waits for the selected replica connection and keeps primary and replica snapshots separate', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/databases',
      response: async () => {
        await gate
        return HttpResponse.json<components['schemas']['DatabaseDetailResponse_Output'][]>([
          replica,
        ])
      },
    })
    const connections = mockSnapshot()
    const { state, queryClient } = renderSize()
    await waitFor(() =>
      expect(queryClient.getQueryData(projectKeys.detail('default'))).toBeDefined()
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading database objects')
    expect(connections).toEqual([])
    await act(async () => release())
    expect(
      await within(await screen.findByRole('table')).findByText('replica_table')
    ).toBeInTheDocument()
    expect(connections).toEqual([replicaConnection])
    await act(async () => state.setSelectedDatabaseId('default'))
    expect(
      await within(await screen.findByRole('table')).findByText('primary_table')
    ).toBeInTheDocument()
    expect(connections).toEqual([replicaConnection, primaryConnection])
    await act(async () => state.setSelectedDatabaseId('replica'))
    expect(
      await within(await screen.findByRole('table')).findByText('replica_table')
    ).toBeInTheDocument()
    expect(connections).toHaveLength(2)
    expect(queryClient.getQueryData(databaseKeys.sizeBreakdown('default', 'replica'))).toBeDefined()
    expect(queryClient.getQueryData(databaseKeys.sizeBreakdown('default', 'default'))).toBeDefined()
    expect(
      JSON.stringify(
        queryClient
          .getQueryCache()
          .getAll()
          .map((query) => query.queryKey)
      )
    ).not.toContain('password')
  })

  it('ends loading when a selected replica is missing without querying the primary', async () => {
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/databases', response: [] })
    const connections = mockSnapshot()
    renderSize()
    expect(await screen.findByText('Failed to retrieve the selected database')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0)
    expect(connections).toEqual([])
  })
  it('shows an error when the SQL response contains invalid size data', async () => {
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/databases', response: [] })
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () =>
        HttpResponse.json<unknown[]>([
          { database_name: 'postgres', database_bytes: -1, instance_bytes: 4000, relations: [] },
        ]),
    })
    renderSize('default')
    expect(await screen.findByText('Failed to retrieve database sizes')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })
})

import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import z from 'zod'

import { NamespaceWithTables } from './NamespaceWithTables'
import {
  useAnalyticsBucketAssociatedEntities,
  useAnalyticsBucketDeleteCleanUp,
} from './useAnalyticsBucketAssociatedEntities'
import type { FDW } from '@/data/fdw/fdws-query'
import { API_URL } from '@/lib/constants'
import { customRender, customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

mockAnimationsApi()

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ ref: 'default', bucketId: 'bucket' }) }
})

vi.mock('@/hooks/misc/useCheckPermissionsV2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/misc/useCheckPermissionsV2')>()
  return { ...actual, useAsyncCheckPermissionsV2: () => ({ can: true }) }
})

vi.mock('./InitializeForeignSchemaDialog', () => ({
  InitializeForeignSchemaDialog: () => <button tabIndex={0}>Connect namespace</button>,
}))

vi.mock('./UpdateForeignSchemaDialog', () => ({
  UpdateForeignSchemaDialog: () => <button tabIndex={0}>Update schema tables</button>,
}))

type ProjectResponse = components['schemas']['ProjectDetailResponse_Output']
type CredentialsResponse = components['schemas']['GetStorageCredentialsResponse_Output']
type NamespaceTablesResponse =
  components['schemas']['StorageAnalyticsBucketNamespaceTablesResponse_Output']

const project: ProjectResponse = {
  cloud_provider: 'AWS',
  connectionString: 'placeholder-connection',
  db_host: 'db.example.com',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Example project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://example.com',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'example-subscription',
  updated_at: '2026-01-01T00:00:00Z',
}
const wrapper: FDW = {
  id: 1,
  name: 'iceberg_wrapper',
  handler: 'iceberg_fdw_handler',
  server_name: 'bucket_fdw_server',
  server_options: ['warehouse=bucket'],
  tables: [
    {
      id: '10',
      name: 'events',
      schema: 'analytics',
      columns: [],
      options: ['table=public.events'],
    },
  ],
}

let wrappers: FDW[]
let namespaceTables: NamespaceTablesResponse
let credentials: CredentialsResponse
let requests: string[]
let sqlMutations: string[]
const recordRequest = ({ request }: { request: Request }) => {
  requests.push(`${request.method} ${request.url.slice(API_URL.length).split('?')[0]}`)
}

beforeEach(() => {
  wrappers = [wrapper]
  namespaceTables = { data: [{ name: 'events', namespace: ['public'] }] }
  credentials = {
    data: [{ id: 'example-key', description: 'bucket_keys', created_at: '2026-01-01T00:00:00Z' }],
  }
  requests = []
  sqlMutations = []
  mswServer.events.on('request:start', recordRequest)

  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<ProjectResponse>(project),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/storage/:ref/credentials',
    response: () => HttpResponse.json<CredentialsResponse>(credentials),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/storage/:ref/analytics-buckets/:id/namespaces/:namespace/tables',
    response: () => HttpResponse.json<NamespaceTablesResponse>(namespaceTables),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const { query } = z.object({ query: z.string() }).parse(await request.json())
      if (query.includes('drop server') || query.includes('drop foreign table')) {
        sqlMutations.push(query)
        wrappers = query.includes('drop server') ? [] : [{ ...wrapper, tables: [] }]
        return HttpResponse.json<FDW[]>([])
      }
      return HttpResponse.json<FDW[]>(wrappers)
    },
  })
  addAPIMock({
    method: 'delete',
    path: '/platform/storage/:ref/credentials/:id',
    response: () => {
      credentials = { data: [] }
      return HttpResponse.json<Record<string, never>>({})
    },
  })
  addAPIMock({
    method: 'delete',
    path: '/platform/storage/:ref/analytics-buckets/:id/namespaces/:namespace/tables/:table',
    response: () => {
      namespaceTables = { data: [] }
      return HttpResponse.json<Record<string, never>>({})
    },
  })
})

afterEach(() => {
  mswServer.events.removeListener('request:start', recordRequest)
})

describe('Analytics Buckets after Pipelines retirement', () => {
  it('retains wrapper and S3 key cleanup without accessing Pipelines', async () => {
    const { result } = customRenderHook(() => ({
      entities: useAnalyticsBucketAssociatedEntities({ projectRef: 'default', bucketId: 'bucket' }),
      cleanup: useAnalyticsBucketDeleteCleanUp({ projectRef: 'default', bucketId: 'bucket' }),
    }))

    await waitFor(() => {
      expect(result.current.entities.icebergWrapper?.server_name).toBe('bucket_fdw_server')
      expect(result.current.entities.s3AccessKey?.id).toBe('example-key')
    })

    await act(() => result.current.cleanup.mutateAsync())

    expect(sqlMutations).toHaveLength(1)
    expect(sqlMutations[0]).toContain('drop server if exists bucket_fdw_server cascade')
    expect(requests).toContain('DELETE /platform/storage/default/credentials/example-key')
    expect(requests.filter((request) => request.includes('/replication/'))).toEqual([])
  })

  it('keeps the empty namespace instructions and foreign schema action', async () => {
    wrappers = [{ ...wrapper, tables: [] }]
    namespaceTables = { data: [] }
    customRender(
      <NamespaceWithTables
        namespace="public"
        schema="analytics"
        tables={[]}
        wrapperValues={{ warehouse: 'bucket' }}
      />
    )

    expect(await screen.findByText('No tables yet')).toBeInTheDocument()
    expect(
      screen.getByText('Publish an analytics table from your Iceberg client')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect namespace' })).toBeInTheDocument()
    await waitFor(() => expect(requests).toContain('POST /platform/pg-meta/default/query'))
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    expect(requests.filter((request) => request.includes('/replication/'))).toEqual([])
  })

  it('deletes an Iceberg table and its foreign table without starting a pipeline', async () => {
    customRender(
      <NamespaceWithTables
        namespace="public"
        schema="analytics"
        tables={[]}
        wrapperValues={{ warehouse: 'bucket' }}
      />
    )
    expect(await screen.findByText('analytics.events')).toBeInTheDocument()
    expect(screen.queryByText('Replication Status')).not.toBeInTheDocument()
    const tableRow = screen.getByRole('row', { name: 'events' })
    await userEvent.click(within(tableRow).getByRole('button'))
    expect(screen.queryByRole('menuitem', { name: /replication/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete table' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete table' }))

    await waitFor(() => expect(sqlMutations).toHaveLength(1))
    expect(sqlMutations[0]).toContain('drop foreign table')
    expect(sqlMutations[0]).toContain('drop foreign table if exists analytics.events')
    expect(requests).toContain(
      'DELETE /platform/storage/default/analytics-buckets/bucket/namespaces/public/tables/events'
    )
    expect(requests.filter((request) => request.includes('/replication/'))).toEqual([])
  })
})

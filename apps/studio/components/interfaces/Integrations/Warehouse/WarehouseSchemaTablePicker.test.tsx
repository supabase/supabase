import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'
import type { SchemasData } from '@/data/database/schemas-query'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import type { TablesData } from '@/data/tables/tables-query'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']
type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type RunQueryBody = components['schemas']['RunQueryBody']
type WarehouseSetupBody = components['schemas']['WarehouseSetupBody']
type WarehouseSetupResponse = components['schemas']['WarehouseSetupResponse_Output']

mockAnimationsApi()

const PROJECT: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres@localhost:5432/postgres',
  db_host: 'db.default.supabase.co',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_hibernating: false,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co/rest/v1',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const SCHEMAS: SchemasData = [
  { id: 1, name: 'public', owner: 'postgres', comment: null },
  { id: 2, name: 'analytics', owner: 'postgres', comment: null },
]

const TABLES: TablesData = [
  {
    id: 1,
    schema: 'public',
    name: 'orders',
    rls_enabled: false,
    rls_forced: false,
    replica_identity: 'DEFAULT',
    bytes: 1024,
    size: '1024 bytes',
    live_rows_estimate: 10,
    dead_rows_estimate: 0,
    comment: null,
    primary_keys: [],
    relationships: [],
  },
  {
    id: 2,
    schema: 'public',
    name: 'customers',
    rls_enabled: false,
    rls_forced: false,
    replica_identity: 'DEFAULT',
    bytes: 1024,
    size: '1024 bytes',
    live_rows_estimate: 10,
    dead_rows_estimate: 0,
    comment: null,
    primary_keys: [],
    relationships: [],
  },
  {
    id: 3,
    schema: 'analytics',
    name: 'events',
    rls_enabled: false,
    rls_forced: false,
    replica_identity: 'DEFAULT',
    bytes: 1024,
    size: '1024 bytes',
    live_rows_estimate: 10,
    dead_rows_estimate: 0,
    comment: null,
    primary_keys: [],
    relationships: [],
  },
]

const SOURCES: ReplicationSourcesResponse = {
  sources: [
    {
      id: 1,
      name: 'default',
      tenant_id: 'tenant',
      config: { host: 'db.internal', name: 'main-db', port: 5432, username: 'etl_user' },
    },
  ],
}

const PUBLICATION: PublicationDetailsResponse = {
  name: 'supabase_warehouse',
  config: {
    type: 'tables',
    tables: [
      { id: 1, schema: 'public', name: 'orders', columns: null, row_filter: null },
      { id: 2, schema: 'public', name: 'customers', columns: null, row_filter: null },
    ],
    operations: ['insert', 'update', 'delete', 'truncate'],
    publish_via_partition_root: false,
  },
  tables: [
    { id: 1, schema: 'public', name: 'orders', kind: 'table', partition_parent_id: null },
    { id: 2, schema: 'public', name: 'customers', kind: 'table', partition_parent_id: null },
  ],
}

const mockPickerQueries = ({
  isEditing,
  tables = TABLES,
  schemas = SCHEMAS,
}: {
  isEditing: boolean
  tables?: TablesData
  schemas?: SchemasData
}) => {
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: PROJECT })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const body = (await request.json()) as RunQueryBody
      const result = body.query.includes("obj_description(n.oid, 'pg_namespace')")
        ? schemas
        : tables
      return HttpResponse.json<SchemasData | TablesData>(result)
    },
  })

  if (isEditing) {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources',
      response: () => HttpResponse.json<ReplicationSourcesResponse>(SOURCES),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
      response: () => HttpResponse.json<PublicationDetailsResponse>(PUBLICATION),
    })
  }
}

const WarehousePickerHarness = ({ isEditing = false }: { isEditing?: boolean }) => {
  const setupMutation = useWarehouseSetupMutation()
  return (
    <WarehouseSchemaTablePicker
      isEditing={isEditing}
      isSubmitting={setupMutation.isPending}
      onSubmit={(targets) => setupMutation.mutate({ projectRef: 'default', body: { targets } })}
    />
  )
}

const mockSetupMutation = () => {
  const requests: WarehouseSetupBody[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/warehouse/:ref/setup',
    response: async ({ request }) => {
      requests.push((await request.json()) as WarehouseSetupBody)
      return HttpResponse.json<WarehouseSetupResponse>({ pipeline_id: 1, tables: [] })
    },
  })
  return requests
}

describe('WarehouseSchemaTablePicker', () => {
  test('starts empty and supports selecting every table in a schema', async () => {
    mockPickerQueries({ isEditing: false })
    const requests = mockSetupMutation()

    customRender(<WarehousePickerHarness />)

    expect(await screen.findByText('0 tables selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enable Warehouse' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('combobox', { name: 'Select tables to replicate' }))
    await userEvent.click(screen.getAllByText('Select all')[1])

    expect(screen.getByText('2 tables selected')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enable Warehouse' }))

    await waitFor(() =>
      expect(requests).toEqual([{ targets: [{ type: 'schema', schema: 'public' }] }])
    )
  })

  test('preselects replicated tables and submits a replacement after removal', async () => {
    mockPickerQueries({ isEditing: true })
    const requests = mockSetupMutation()

    customRender(<WarehousePickerHarness isEditing />)

    expect(await screen.findByText('2 tables selected')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('combobox', { name: 'Select tables to replicate' }))
    await userEvent.click(screen.getByText('customers'))

    expect(screen.getByText('1 table selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('2 tables selected')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('combobox', { name: 'Select tables to replicate' }))
    await userEvent.click(screen.getByText('customers'))

    await userEvent.click(screen.getByRole('button', { name: 'Update replicated tables' }))

    await waitFor(() =>
      expect(requests).toEqual([{ targets: [{ type: 'table', schema: 'public', name: 'orders' }] }])
    )
  })

  test('filters tables by schema name or qualified table name', async () => {
    mockPickerQueries({ isEditing: false })

    customRender(<WarehousePickerHarness />)

    fireEvent.click(await screen.findByRole('combobox', { name: 'Select tables to replicate' }))
    await userEvent.type(screen.getByPlaceholderText('Search schemas and tables...'), 'analytics')

    expect(screen.getByText('events')).toBeInTheDocument()
    expect(screen.queryByText('orders')).not.toBeInTheDocument()
    expect(screen.queryByText('customers')).not.toBeInTheDocument()

    await userEvent.clear(screen.getByPlaceholderText('Search schemas and tables...'))
    await userEvent.type(screen.getByPlaceholderText('Search schemas and tables...'), 'public.ord')

    expect(screen.getByText('orders')).toBeInTheDocument()
    expect(screen.queryByText('customers')).not.toBeInTheDocument()
    expect(screen.queryByText('events')).not.toBeInTheDocument()

    await userEvent.clear(screen.getByPlaceholderText('Search schemas and tables...'))
    await userEvent.type(screen.getByPlaceholderText('Search schemas and tables...'), 'orders')

    expect(screen.getByText('orders')).toBeInTheDocument()
    expect(screen.queryByText('customers')).not.toBeInTheDocument()
    expect(screen.queryByText('events')).not.toBeInTheDocument()
  })

  test('wraps selected table badges and shows an overflow count past the limit', async () => {
    const manyTables: TablesData = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      schema: 'public',
      name: `table_${String(index + 1).padStart(2, '0')}`,
      rls_enabled: false,
      rls_forced: false,
      replica_identity: 'DEFAULT',
      bytes: 1024,
      size: '1024 bytes',
      live_rows_estimate: 10,
      dead_rows_estimate: 0,
      comment: null,
      primary_keys: [],
      relationships: [],
    }))

    mockPickerQueries({
      isEditing: false,
      schemas: [{ id: 1, name: 'public', owner: 'postgres', comment: null }],
      tables: manyTables,
    })

    customRender(<WarehousePickerHarness />)

    const trigger = await screen.findByRole('combobox', { name: 'Select tables to replicate' })
    fireEvent.click(trigger)
    await userEvent.click(screen.getByText('Select all'))
    // Close the list so trigger textContent is only the selected badges.
    fireEvent.click(trigger)

    expect(screen.getByText('12 tables selected')).toBeInTheDocument()
    expect(trigger.firstElementChild).toHaveClass('flex-wrap')
    expect(trigger).toHaveTextContent('public.table_01')
    expect(trigger).toHaveTextContent('public.table_10')
    expect(trigger).toHaveTextContent('+2')
    expect(trigger).not.toHaveTextContent('public.table_11')
    expect(trigger).not.toHaveTextContent('public.table_12')
  })
})

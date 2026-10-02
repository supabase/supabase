import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { WarehouseOverviewTab } from './OverviewTab'
import type { SchemasData } from '@/data/database/schemas-query'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import type { TablesData } from '@/data/tables/tables-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']
type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type RunQueryBody = components['schemas']['RunQueryBody']
type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse_Output']
type WarehouseSetupBody = components['schemas']['WarehouseSetupBody']
type WarehouseSetupResponse = components['schemas']['WarehouseSetupResponse_Output']

// Both integration shells are live, and the flag reads a context plus ConfigCat that
// `customRender` doesn't provide.
const mockIsMarketplaceEnabled = vi.fn(() => false)
const mockTrack = vi.fn()
vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsMarketplaceEnabled: () => mockIsMarketplaceEnabled(),
}))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))

vi.mock('../Integration/IntegrationOverviewTab', () => ({
  IntegrationOverviewTab: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Exercised by its own unit tests, and it fires four upstream queries of its own.
vi.mock('./WarehouseSchemaTablePicker', () => ({
  WarehouseSchemaTablePicker: ({
    error,
    isEditing,
    onSubmit,
  }: {
    error?: { message: string } | null
    isEditing?: boolean
    onSubmit: (targets: [{ type: 'table'; schema: string; name: string }]) => void
  }) => (
    <section>
      <h2>Tables</h2>
      <span>Replicated tables picker</span>
      {!!error && <span>Picker error: {error.message}</span>}
      <button
        tabIndex={0}
        onClick={() => onSubmit([{ type: 'table', schema: 'public', name: 'orders' }])}
      >
        {isEditing ? 'Submit edited tables' : 'Submit initial tables'}
      </button>
    </section>
  ),
}))

mockAnimationsApi()
dayjs.extend(duration)

const FDW_STATUS: WarehouseSetupStatusResponse['fdw_status'] = {
  extension_available: true,
  extension_installed: true,
  foreign_schema_imported: true,
  schema_created: true,
  server_configured: true,
  wrapper_installed: true,
}

const mockSetupStatus = (status: Partial<WarehouseSetupStatusResponse>) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: () =>
      HttpResponse.json<WarehouseSetupStatusResponse>({
        fdw_status: FDW_STATUS,
        setup_status: 'not_started',
        steps: [],
        tables: [],
        ...status,
      }),
  })

const mockProject = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    // @ts-expect-error partial project response used by AlertError
    response: {
      cloud_provider: 'localhost',
      id: 1,
      inserted_at: '2021-08-02T06:40:40.646Z',
      name: 'Default Project',
      organization_id: 1,
      ref: 'default',
      region: 'local',
      status: 'ACTIVE_HEALTHY',
    },
  })

const REPLICATION_PROJECT: ProjectDetail = {
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

const createTable = (id: number, schema: string, name: string): TablesData[number] => ({
  id,
  schema,
  name,
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
})

const TABLES: TablesData = [
  createTable(1, 'public', 'orders'),
  createTable(2, 'public', 'customers'),
  createTable(3, 'analytics', 'events'),
  createTable(4, 'analytics', 'sessions'),
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

// Every table of `public` plus one table of `analytics`: one schema target, one table target.
const PUBLICATION_TABLES: PublicationDetailsResponse['tables'] = [
  { id: 1, schema: 'public', name: 'orders', kind: 'table', partition_parent_id: null },
  { id: 2, schema: 'public', name: 'customers', kind: 'table', partition_parent_id: null },
  { id: 3, schema: 'analytics', name: 'events', kind: 'table', partition_parent_id: null },
]

// The disable card reads what is currently replicated from these four queries.
const mockReplicatedTableQueries = () => {
  const publicationRequests: string[] = []
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: REPLICATION_PROJECT })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const body = (await request.json()) as RunQueryBody
      const result = body.query.includes("obj_description(n.oid, 'pg_namespace')")
        ? SCHEMAS
        : TABLES
      return HttpResponse.json<SchemasData | TablesData>(result)
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<ReplicationSourcesResponse>(SOURCES),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: ({ params }) => {
      publicationRequests.push(String(params.publication_name))
      return HttpResponse.json<PublicationDetailsResponse>({
        name: 'supabase_warehouse',
        config: {
          type: 'tables',
          tables: PUBLICATION_TABLES.map(({ id, schema, name }) => ({
            id,
            schema,
            name,
            columns: null,
            row_filter: null,
          })),
          operations: ['insert', 'update', 'delete', 'truncate'],
          publish_via_partition_root: false,
        },
        tables: PUBLICATION_TABLES,
      })
    },
  })

  return { publicationRequests }
}

describe('WarehouseOverviewTab', () => {
  beforeEach(() => {
    mockIsMarketplaceEnabled.mockReturnValue(true)
    mockTrack.mockClear()
  })

  test.each([false, true])(
    'offers only the picker before setup (marketplace: %s)',
    async (isMarketplaceEnabled) => {
      mockIsMarketplaceEnabled.mockReturnValue(isMarketplaceEnabled)
      mockSetupStatus({ setup_status: 'not_started' })

      customRender(<WarehouseOverviewTab />)

      expect(await screen.findByText('Replicated tables picker')).toBeInTheDocument()
      expect(screen.queryByText('External access')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Disable Warehouse' })).not.toBeInTheDocument()
    }
  )

  test.each(['setting_up', 'copying'] as const)(
    'shows setup progress for %s',
    async (setupStatus) => {
      mockSetupStatus({
        setup_status: setupStatus,
        tables:
          setupStatus === 'copying'
            ? [
                { schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'live' },
                {
                  schema: 'public',
                  name: 'customers',
                  copy_name: 'public.customers',
                  state: 'syncing',
                  lag_ms: 0,
                },
              ]
            : [],
      })

      customRender(<WarehouseOverviewTab />)

      expect(await screen.findByText('Warehouse is being set up')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Status' })).toBeInTheDocument()
      if (setupStatus === 'copying') {
        expect(
          screen.getByText('Backfilling selected tables. 1 of 2 tables synced.')
        ).toBeInTheDocument()
        expect(screen.getByText('orders')).toBeInTheDocument()
        expect(screen.getByText('customers')).toBeInTheDocument()
        expect(screen.queryByText('Caught up')).not.toBeInTheDocument()
      }
    }
  )

  test('shows the setup failure and retry action', async () => {
    mockProject()
    mockSetupStatus({
      setup_status: 'error',
      steps: [{ name: 'warehouse_copy', status: 'error', message: 'Failed to copy public.orders' }],
      tables: [{ schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'error' }],
    })

    customRender(<WarehouseOverviewTab />)

    expect(await screen.findByText('Warehouse setup failed')).toBeInTheDocument()
    expect(screen.getByText('Failed to copy public.orders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  test('shows the latest error when retrying setup fails', async () => {
    mockProject()
    mockSetupStatus({
      setup_status: 'error',
      steps: [{ name: 'warehouse_copy', status: 'error', message: 'Initial setup failed' }],
      tables: [{ schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'error' }],
    })
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Retry could not be started' }, { status: 500 }),
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Retry could not be started')).toBeInTheDocument()
    expect(screen.queryByText('Initial setup failed')).not.toBeInTheDocument()
  })

  test('shows Status, Tables, Connect, then Disable once setup is complete', async () => {
    mockSetupStatus({
      setup_status: 'complete',
      tables: [
        {
          schema: 'public',
          name: 'orders',
          copy_name: 'public.orders',
          state: 'live',
          lag_ms: 4000,
        },
        {
          schema: 'public',
          name: 'customers',
          copy_name: 'public.customers',
          state: 'syncing',
          lag_ms: 18000,
        },
        { schema: 'analytics', name: 'events', copy_name: 'analytics.events', state: 'error' },
      ],
    })
    mockReplicatedTableQueries()

    customRender(<WarehouseOverviewTab />)

    // findByRole throws on duplicates, so this also guards the section titles staying distinct.
    for (const name of ['Status', 'Tables', 'Connect', 'Disable']) {
      expect(await screen.findByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getByText('Replicated tables picker')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.getByText('Backfilling')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Caught up')).toBeInTheDocument()
    expect(screen.queryByText(/behind$/)).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Lag' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Size' })).not.toBeInTheDocument()

    const headings = screen
      .getAllByRole('heading')
      .map((heading) => heading.textContent)
      .filter((heading) => ['Status', 'Tables', 'Connect', 'Disable'].includes(heading ?? ''))

    expect(headings).toEqual(['Status', 'Tables', 'Connect', 'Disable'])
  })

  test('tracks initial setup but not table selection edits as enablement', async () => {
    mockSetupStatus({ setup_status: 'not_started' })
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: () => HttpResponse.json<WarehouseSetupResponse>({ pipeline_id: 1, tables: [] }),
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Submit initial tables' }))
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('warehouse_enabled', {
        source: 'integrations_overview',
        schemaTargetCount: 0,
        tableTargetCount: 1,
      })
    )
  })

  test('does not track an edited table selection as enablement', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    mockReplicatedTableQueries()
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: () => HttpResponse.json<WarehouseSetupResponse>({ pipeline_id: 1, tables: [] }),
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Submit edited tables' }))
    await waitFor(() => expect(screen.getByText('Replicated tables picker')).toBeInTheDocument())
    expect(mockTrack).not.toHaveBeenCalledWith('warehouse_enabled', expect.anything())
  })

  test('disables Warehouse with an empty target list after confirmation', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    mockReplicatedTableQueries()
    const setupRequests: WarehouseSetupBody[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: async ({ request }) => {
        setupRequests.push((await request.json()) as WarehouseSetupBody)
        return HttpResponse.json<WarehouseSetupResponse>({ pipeline_id: 1, tables: [] })
      },
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))
    expect(setupRequests).toEqual([])

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Copied data remains in DuckLake storage until deleted')
    expect(screen.queryByPlaceholderText('Type the project ref to confirm')).not.toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Disable Warehouse' }))

    await waitFor(() => expect(setupRequests).toEqual([{ targets: [] }]))
  })

  test('tracks how much was being replicated when Warehouse is disabled', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    const { publicationRequests } = mockReplicatedTableQueries()
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: () => HttpResponse.json<WarehouseSetupResponse>({ pipeline_id: 1, tables: [] }),
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))
    const dialog = await screen.findByRole('alertdialog')
    await waitFor(() => expect(publicationRequests).toEqual(['supabase_warehouse']))

    fireEvent.click(within(dialog).getByRole('button', { name: 'Disable Warehouse' }))

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('warehouse_disabled', {
        schemaTargetCount: 1,
        tableTargetCount: 1,
      })
    )
  })

  test('shows a disable error and allows retrying from the open confirmation', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    mockReplicatedTableQueries()
    let attempts = 0
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: () => {
        attempts += 1
        if (attempts === 1) {
          return HttpResponse.json<APIErrorBody>(
            { message: 'Disable request failed' },
            { status: 500 }
          )
        }
        return HttpResponse.json<WarehouseSetupResponse>({ pipeline_id: 1, tables: [] })
      },
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Disable Warehouse' })

    fireEvent.click(confirm)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to disable Warehouse: Disable request failed'
      )
    )
    expect(dialog).toBeVisible()
    expect(confirm).toBeEnabled()

    fireEvent.click(confirm)

    await waitFor(() => expect(attempts).toBe(2))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  test('shows a status query failure without blocking an unrelated route', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/setup-status',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })
    mockProject()

    customRender(<WarehouseOverviewTab />)

    expect(await screen.findByText('Failed to load Warehouse status')).toBeInTheDocument()
  })
})

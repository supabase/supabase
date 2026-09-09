import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { DestinationForm } from './index'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type DestinationResponse = components['schemas']['DestinationResponse_Output']
type PipelineResponse = components['schemas']['PipelineResponse_Output']
type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']
type PublicationNamesResponse = components['schemas']['ReadPublicationsResponse_Output']
type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse']
type SourcesResponse = components['schemas']['SourcesResponse_Output']

const mocks = vi.hoisted(() => ({
  resetValidation: vi.fn(),
  submitPipeline: vi.fn(),
  validateConfiguration: vi.fn(),
}))

const existingBatch = {
  max_fill_ms: 500,
  max_bytes: 8_388_608,
  memory_budget_ratio: 0.2,
}

const existingDestination = {
  destinationId: 7,
  pipelineId: 8,
  enabled: true,
  statusName: 'started',
}

const sourcesData: SourcesResponse = {
  sources: [
    {
      id: 42,
      name: 'project-ref',
      tenant_id: 'tenant',
      config: { host: 'db.internal', name: 'postgres', port: 5432, username: 'postgres' },
    },
  ],
}
const publication: PublicationDetailsResponse = {
  name: 'analytics',
  config: {
    type: 'tables',
    tables: [{ id: 101, schema: 'public', name: 'orders', columns: null, row_filter: null }],
    operations: ['insert', 'update', 'delete', 'truncate'],
    publish_via_partition_root: false,
  },
  tables: [
    {
      id: 101,
      schema: 'public',
      name: 'orders',
      kind: 'table',
      partition_parent_id: null,
    },
  ],
}
const secondaryPublication: PublicationDetailsResponse = {
  name: 'reporting',
  config: {
    type: 'tables',
    tables: [{ id: 202, schema: 'public', name: 'invoices', columns: null, row_filter: null }],
    operations: ['insert'],
    publish_via_partition_root: false,
  },
  tables: [
    {
      id: 202,
      schema: 'public',
      name: 'invoices',
      kind: 'table',
      partition_parent_id: null,
    },
  ],
}
const destinationData: DestinationResponse = {
  id: 7,
  tenant_id: 'tenant',
  name: 'Analytics',
  config: {
    big_query: {
      project_id: 'example-project',
      dataset_id: 'analytics',
      connection_pool_size: 5,
    },
  },
}
let pipelineTableIds = [101, 999]
const getPipelineData = (): PipelineResponse => ({
  id: 8,
  tenant_id: 'tenant',
  source_id: 42,
  source_name: 'postgres',
  destination_id: 7,
  destination_name: 'Analytics',
  replicator_id: 9,
  config: {
    publication_name: 'analytics',
    table_sync_copy: { type: 'include_tables', table_ids: pipelineTableIds },
    batch: existingBatch,
    max_table_sync_workers: 4,
    max_copy_connections_per_table: 1,
  },
})
const projectSettings: ProjectSettingsResponse = {
  app_config: {
    db_schema: 'public',
    endpoint: 'project-ref.supabase.co',
    storage_endpoint: 'project-ref.supabase.co/storage/v1',
  },
  cloud_provider: 'AWS',
  db_dns_name: 'db.project-ref.supabase.co',
  db_host: 'db.project-ref.supabase.co',
  db_ip_addr_config: 'ipv4',
  db_name: 'postgres',
  db_port: 5432,
  db_user: 'postgres',
  inserted_at: '2026-08-28T00:00:00Z',
  name: 'project-ref',
  ref: 'project-ref',
  region: 'ap-southeast-1',
  ssl_enforced: true,
  status: 'ACTIVE_HEALTHY',
}

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ ref: 'project-ref' }) }
})

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: PropsWithChildren) => children,
  motion: { div: ({ children }: PropsWithChildren) => <div>{children}</div> },
}))

vi.mock('ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui')>()

  return {
    ...actual,
    Button: ({
      children,
      loading: _loading,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
      <button tabIndex={0} {...props}>
        {children}
      </button>
    ),
    DialogSectionSeparator: () => null,
    Form: ({ children }: PropsWithChildren) => children,
    Select: ({ children }: PropsWithChildren) => <div>{children}</div>,
    SelectContent: ({ children }: PropsWithChildren) => <div>{children}</div>,
    SelectItem: ({ children }: PropsWithChildren) => <div>{children}</div>,
    SelectTrigger: ({ children }: PropsWithChildren) => <div>{children}</div>,
    SelectValue: () => null,
    SheetFooter: ({ children }: PropsWithChildren) => <div>{children}</div>,
    SheetSection: ({ children }: PropsWithChildren) => <div>{children}</div>,
    Tooltip: ({ children }: PropsWithChildren) => <div>{children}</div>,
    TooltipContent: ({ children }: PropsWithChildren) => <div>{children}</div>,
    TooltipTrigger: ({ children }: PropsWithChildren) => <span>{children}</span>,
  }
})

vi.mock('ui-patterns/Admonition', () => ({
  Admonition: ({ children }: PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('ui-patterns/form/FormItemLayout/FormItemLayout', () => ({
  FormItemLayout: ({ children }: PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('../../useIsETLPrivateAlpha', () => ({
  useIsETLBigQueryPrivateAlpha: () => true,
  useIsETLClickHousePrivateAlpha: () => false,
  useIsETLDucklakePrivateAlpha: () => false,
  useIsETLIcebergPrivateAlpha: () => false,
  useIsETLSnowflakePrivateAlpha: () => false,
}))

vi.mock('./useDestinationForm', () => ({
  useDestinationForm: () => ({
    isValidating: false,
    validateConfiguration: mocks.validateConfiguration,
    isSaving: false,
    submitPipeline: mocks.submitPipeline,
    hasRunValidation: false,
    destinationValidationFailures: [],
    pipelineValidationFailures: [],
    resetValidation: mocks.resetValidation,
  }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: false }),
}))

vi.mock('./DestinationNameInput', () => ({ DestinationNameInput: () => null }))
vi.mock('./PublicationSelection', () => ({
  PublicationSelection: ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => (
    <button
      type="button"
      tabIndex={0}
      onClick={() => {
        form.setValue('publicationName', 'reporting', {
          shouldDirty: true,
          shouldValidate: true,
        })
        form.setValue('tableSyncCopyMode', 'include_tables', {
          shouldDirty: true,
          shouldValidate: true,
        })
        form.setValue('tableSyncCopyTableIds', ['202'], {
          shouldDirty: true,
          shouldValidate: true,
        })
      }}
    >
      Switch publication and select table
    </button>
  ),
}))
vi.mock('./TableCopySelection', () => ({
  TableCopySelection: ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => (
    <div>{form.formState.errors.tableSyncCopyTableIds?.message}</div>
  ),
}))
vi.mock('./AdvancedSettings', () => ({ AdvancedSettings: () => null }))
vi.mock('./BigQuery/Fields', () => ({ BigQueryFields: () => null }))
vi.mock('./AnalyticsBucket/Fields', () => ({ AnalyticsBucketFields: () => null }))
vi.mock('./DuckLake/Fields', () => ({ DuckLakeFields: () => null }))
vi.mock('./Snowflake/Fields', () => ({ SnowflakeFields: () => null }))
vi.mock('./ClickHouse/Fields', () => ({ ClickHouseFields: () => null }))
vi.mock('./NewPublicationPanel', () => ({ NewPublicationPanel: () => null }))
vi.mock('./NoDestinationsAvailable', () => ({ NoDestinationsAvailable: () => null }))
vi.mock('./PipelineCostDialog', () => ({ PipelineCostDialog: () => null }))
vi.mock('./ValidationFailuresSection', () => ({ ValidationFailuresSection: () => null }))
vi.mock('./ValidationWarningsDialog', () => ({ ValidationWarningsDialog: () => null }))
vi.mock('@/components/interfaces/Storage/AnalyticsBuckets/CreateAnalyticsBucketSheet', () => ({
  CreateAnalyticsBucketSheet: () => null,
}))

describe('DestinationForm edit submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pipelineTableIds = [101, 999]
    mocks.submitPipeline.mockResolvedValue(undefined)
    mocks.validateConfiguration.mockResolvedValue({ canContinue: true, warnings: [] })

    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources',
      response: () => HttpResponse.json<SourcesResponse>(sourcesData),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications',
      response: () =>
        HttpResponse.json<PublicationNamesResponse>({
          publications: [{ name: publication.name }, { name: secondaryPublication.name }],
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
      response: ({ params }) =>
        HttpResponse.json<PublicationDetailsResponse>(
          params.publication_name === secondaryPublication.name ? secondaryPublication : publication
        ),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations/:destination_id',
      response: () => HttpResponse.json<DestinationResponse>(destinationData),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id',
      response: () => HttpResponse.json<PipelineResponse>(getPipelineData()),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/settings',
      response: () => HttpResponse.json<ProjectSettingsResponse>(projectSettings),
    })
  })

  it('bypasses create validation and submits the pruned table policy with the existing batch', async () => {
    const onClose = vi.fn()

    customRender(
      <DestinationForm
        selectedType="BigQuery"
        visible
        existingDestination={existingDestination}
        onClose={onClose}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Apply and restart pipeline' })
    await waitFor(() => expect(submitButton).toBeEnabled())
    fireEvent.click(submitButton)

    await waitFor(() => expect(mocks.submitPipeline).toHaveBeenCalledOnce())

    expect(mocks.validateConfiguration).not.toHaveBeenCalled()
    expect(mocks.submitPipeline).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tableSyncCopyMode: 'include_tables',
        tableSyncCopyTableIds: ['101'],
      }),
      existingDestination,
      existingBatch,
      onSuccess: expect.any(Function),
      onClose,
    })
  })

  it('rejects an edit when every selected table has left the publication', async () => {
    pipelineTableIds = [999]

    customRender(
      <DestinationForm
        selectedType="BigQuery"
        visible
        existingDestination={existingDestination}
        onClose={vi.fn()}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Apply and restart pipeline' })
    await waitFor(() => expect(submitButton).toBeEnabled())
    fireEvent.click(submitButton)

    expect(await screen.findByText('Select at least one table')).toBeInTheDocument()
    expect(mocks.validateConfiguration).not.toHaveBeenCalled()
    expect(mocks.submitPipeline).not.toHaveBeenCalled()
  })

  it('submits against the newly loaded publication immediately after switching', async () => {
    const onClose = vi.fn()

    customRender(
      <DestinationForm
        selectedType="BigQuery"
        visible
        existingDestination={existingDestination}
        onClose={onClose}
      />
    )

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Apply and restart pipeline' })).toBeEnabled()
    )
    fireEvent.click(screen.getByRole('button', { name: 'Switch publication and select table' }))

    const submitButton = screen.getByRole('button', { name: 'Apply and restart pipeline' })
    await waitFor(() => expect(submitButton).toBeEnabled())
    fireEvent.click(submitButton)

    await waitFor(() => expect(mocks.submitPipeline).toHaveBeenCalledOnce())
    expect(mocks.submitPipeline).toHaveBeenCalledWith({
      data: expect.objectContaining({
        publicationName: 'reporting',
        tableSyncCopyMode: 'include_tables',
        tableSyncCopyTableIds: ['202'],
      }),
      existingDestination,
      existingBatch,
      onSuccess: expect.any(Function),
      onClose,
    })
  })
})

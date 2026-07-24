import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { DestinationForm } from './index'

const mocks = vi.hoisted(() => ({
  refetchPublications: vi.fn(),
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

const sourcesData = { sources: [{ id: 42, name: 'project-ref' }] }
const publications = [
  {
    name: 'analytics',
    tables: [{ id: 101, schema: 'public', name: 'orders' }],
  },
]
const destinationData = {
  name: 'Analytics',
  config: {
    big_query: {
      project_id: 'example-project',
      dataset_id: 'analytics',
      connection_pool_size: 5,
    },
  },
}
const pipelineData = {
  config: {
    publication_name: 'analytics',
    table_sync_copy: { type: 'include_tables' as const, table_ids: [101, 999] },
    batch: existingBatch,
    max_table_sync_workers: 4,
    max_copy_connections_per_table: 1,
  },
}
const projectSettings = { region: 'ap-southeast-1' }

vi.mock('common', () => ({ useParams: () => ({ ref: 'project-ref' }) }))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: PropsWithChildren) => children,
  motion: { div: ({ children }: PropsWithChildren) => <div>{children}</div> },
}))

vi.mock('ui', () => ({
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
}))

vi.mock('ui-patterns/admonition', () => ({
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

vi.mock('@/data/api-keys/api-keys-query', () => ({ useAPIKeys: () => ({ data: undefined }) }))

vi.mock('@/data/config/project-settings-v2-query', () => ({
  useProjectSettingsV2Query: () => ({ data: projectSettings }),
}))

vi.mock('@/data/replication/sources-query', () => ({
  useReplicationSourcesQuery: () => ({ data: sourcesData }),
  useReplicationSourceId: () => sourcesData.sources[0]?.id,
}))

vi.mock('@/data/replication/publications-query', () => ({
  useReplicationPublicationsQuery: () => ({
    data: publications,
    isPending: false,
    isError: false,
    isSuccess: true,
    refetch: mocks.refetchPublications,
  }),
}))

vi.mock('@/data/replication/destination-by-id-query', () => ({
  useReplicationDestinationByIdQuery: () => ({
    data: destinationData,
    isError: false,
    isSuccess: true,
  }),
}))

vi.mock('@/data/replication/pipeline-by-id-query', () => ({
  useReplicationPipelineByIdQuery: () => ({
    data: pipelineData,
    isError: false,
    isSuccess: true,
  }),
}))

vi.mock('./DestinationNameInput', () => ({ DestinationNameInput: () => null }))
vi.mock('./PublicationSelection', () => ({ PublicationSelection: () => null }))
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
    pipelineData.config.table_sync_copy.table_ids = [101, 999]
    mocks.submitPipeline.mockResolvedValue(undefined)
    mocks.validateConfiguration.mockResolvedValue({ canContinue: true, warnings: [] })
  })

  it('bypasses create validation and submits the pruned table policy with the existing batch', async () => {
    const onClose = vi.fn()

    render(
      <DestinationForm
        selectedType="BigQuery"
        visible
        existingDestination={existingDestination}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Apply and restart pipeline' }))

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
    pipelineData.config.table_sync_copy.table_ids = [999]

    render(
      <DestinationForm
        selectedType="BigQuery"
        visible
        existingDestination={existingDestination}
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Apply and restart pipeline' }))

    expect(await screen.findByText('Select at least one table')).toBeInTheDocument()
    expect(mocks.validateConfiguration).not.toHaveBeenCalled()
    expect(mocks.submitPipeline).not.toHaveBeenCalled()
  })
})

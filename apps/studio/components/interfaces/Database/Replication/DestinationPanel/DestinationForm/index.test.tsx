import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { DestinationForm } from './index'
import { projectKeys } from '@/data/projects/keys'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type DestinationResponse = components['schemas']['DestinationResponse_Output']
type PipelineResponse = components['schemas']['PipelineResponse_Output']
type PublicationDetailsResponse = components['schemas']['PublicationDetailsResponse_Output']
type PublicationNamesResponse = components['schemas']['ReadPublicationsResponse_Output']
type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse_Output']
type SourcesResponse = components['schemas']['SourcesResponse_Output']

const mocks = vi.hoisted(() => ({
  isSaving: false,
  isPreviewEnabled: false,
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

const project: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres@localhost:5432/postgres',
  db_host: 'db.project-ref.supabase.co',
  dbVersion: 'supabase-postgres-17.6.1.001',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_hibernating: false,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: 1,
  ref: 'project-ref',
  region: 'us-east-1',
  restUrl: 'https://project-ref.supabase.co/rest/v1',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ ref: 'project-ref' }) }
})

vi.mock('motion/react', () => ({
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
  Admonition: ({
    children,
    title,
    description,
    actions,
  }: PropsWithChildren<{
    title?: ReactNode
    description?: ReactNode
    actions?: ReactNode
  }>) => (
    <div>
      {title}
      {description}
      {children}
      {actions}
    </div>
  ),
}))

vi.mock('ui-patterns/form/FormItemLayout/FormItemLayout', () => ({
  FormItemLayout: ({ children }: PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('../../useIsETLPrivateAlpha', () => ({
  useIsETLBigQueryPrivateAlpha: () => true,
  useIsETLClickHousePrivateAlpha: () => false,
  useIsETLDucklakePrivateAlpha: () => true,
  useIsETLIcebergPrivateAlpha: () => false,
  useIsETLSnowflakePrivateAlpha: () => false,
}))

vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  usePipelineCreationPreview: () => ({ isEnabled: mocks.isPreviewEnabled }),
}))

vi.mock('./useDestinationForm', () => ({
  useDestinationForm: () => ({
    isValidating: false,
    validateConfiguration: mocks.validateConfiguration,
    isSaving: mocks.isSaving,
    submitPipeline: mocks.submitPipeline,
    hasRunValidation: false,
    destinationValidationFailures: [],
    pipelineValidationFailures: [],
    resetValidation: mocks.resetValidation,
  }),
}))

vi.mock('@/hooks/misc/useCheckPermissionsV2', () => ({
  useAsyncCheckPermissionsV2: () => ({ can: true, isLoading: false, isSuccess: true }),
  FGA_PERMISSIONS: {
    PROJECT: {
      API_GATEWAY_KEYS_READ: 'api_gateway_keys_read',
      API_GATEWAY_KEYS_SECRET_READ: 'api_gateway_keys_secret_read',
    },
  },
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
vi.mock('./DuckLake/Fields', () => ({
  DuckLakeFields: ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => (
    <>
      <input aria-label="Destination name" {...form.register('name')} />
      <select aria-label="Publication" {...form.register('publicationName')}>
        <option value="">Select a publication</option>
        <option value="analytics">analytics</option>
      </select>
      <select aria-label="Configuration method" {...form.register('ducklakeMode')}>
        <option value="supabase">Use this Supabase project</option>
        <option value="custom">Enter connection details</option>
      </select>
      <input aria-label="Storage bucket" {...form.register('ducklakeStorageBucket')} />
      <input aria-label="Catalog URL" {...form.register('ducklakeCatalogUrl')} />
      <input aria-label="Data path" {...form.register('ducklakeDataPath')} />
      <input aria-label="S3 access key ID" {...form.register('ducklakeS3AccessKeyId')} />
      <input aria-label="S3 secret access key" {...form.register('ducklakeS3SecretAccessKey')} />
      <input aria-label="S3 region" {...form.register('ducklakeS3Region')} />
      <input aria-label="S3 endpoint" {...form.register('ducklakeS3Endpoint')} />
    </>
  ),
}))
vi.mock('./Snowflake/Fields', () => ({ SnowflakeFields: () => null }))
vi.mock('./ClickHouse/Fields', () => ({ ClickHouseFields: () => null }))
vi.mock('./NewPublicationPanel', () => ({ NewPublicationPanel: () => null }))
vi.mock('./NoDestinationsAvailable', () => ({ NoDestinationsAvailable: () => null }))
vi.mock('./PipelineCostDialog', () => ({
  PipelineCostDialog: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) =>
    open ? (
      <button tabIndex={0} onClick={onConfirm}>
        Confirm pipeline creation
      </button>
    ) : null,
}))
vi.mock('./ValidationFailuresSection', () => ({ ValidationFailuresSection: () => null }))
vi.mock('./ValidationWarningsDialog', () => ({ ValidationWarningsDialog: () => null }))
vi.mock('@/components/interfaces/Storage/AnalyticsBuckets/CreateAnalyticsBucketSheet', () => ({
  CreateAnalyticsBucketSheet: () => null,
}))

describe('DestinationForm', () => {
  beforeEach(() => {
    pipelineTableIds = [101, 999]
    mocks.isSaving = false
    mocks.isPreviewEnabled = false
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

  describe('DuckLake project checks', () => {
    const fillDuckLakeForm = async () => {
      const fields = {
        'Destination name': 'Warehouse',
        Publication: 'analytics',
        'Configuration method': 'custom',
        'Storage bucket': 'warehouse',
        'Catalog URL': 'postgresql://postgres:password@catalog.example.com:5432/postgres',
        'Data path': 's3://warehouse/data',
        'S3 access key ID': 'access-key',
        'S3 secret access key': 'secret-key',
        'S3 region': 'us-east-1',
        'S3 endpoint': 'storage.example.com',
      }
      for (const [label, value] of Object.entries(fields)) {
        fireEvent.change(screen.getByLabelText(label), { target: { value } })
      }

      const submitButton = screen.getByRole('button', { name: 'Start pipeline' })
      await waitFor(() => expect(submitButton).toBeEnabled())
      return submitButton
    }

    it.each(['pending', 'error', 'missing-version'] as const)(
      'blocks managed submission while the project query is %s and allows it after recovery',
      async (queryState) => {
        const response = Promise.withResolvers<void>()
        addAPIMock({
          method: 'get',
          path: '/platform/projects/:ref',
          response: async () => {
            if (queryState === 'pending') {
              await response.promise
              return HttpResponse.json<ProjectDetail>(project)
            }
            if (queryState === 'missing-version') {
              return HttpResponse.json<ProjectDetail>({ ...project, dbVersion: undefined })
            }
            return HttpResponse.json<APIErrorBody>(
              { message: 'Project details unavailable' },
              { status: 500 }
            )
          },
        })

        try {
          customRender(<DestinationForm selectedType="DuckLake" visible onClose={vi.fn()} />)
          const submitButton = await fillDuckLakeForm()
          const compatibilityStatus = screen.getByRole('status')
          expect(compatibilityStatus).toBeEmptyDOMElement()
          fireEvent.change(screen.getByLabelText('Configuration method'), {
            target: { value: 'supabase' },
          })

          expect(submitButton).toBeDisabled()
          if (queryState !== 'pending') {
            expect(await screen.findByText('Failed to load project')).toBeInTheDocument()
            expect(
              screen.getByText(
                queryState === 'error'
                  ? /Project details unavailable/
                  : /The project database version is unavailable/
              )
            ).toBeInTheDocument()
          } else {
            expect(compatibilityStatus).toHaveTextContent('Checking project compatibility...')
          }
          expect(screen.getByRole('status')).toBe(compatibilityStatus)

          // Submitting the form directly also exercises the handler behind the disabled button.
          await act(async () => {
            fireEvent.submit(screen.getByLabelText('Destination name').closest('form')!)
          })
          expect(mocks.validateConfiguration).not.toHaveBeenCalled()
          expect(mocks.submitPipeline).not.toHaveBeenCalled()

          if (queryState !== 'pending') {
            addAPIMock({
              method: 'get',
              path: '/platform/projects/:ref',
              response: () => HttpResponse.json<ProjectDetail>(project),
            })
            fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
          } else {
            response.resolve()
          }

          await waitFor(() => expect(submitButton).toBeEnabled())
          expect(screen.getByRole('status')).toBe(compatibilityStatus)
          expect(compatibilityStatus).toBeEmptyDOMElement()
          fireEvent.click(submitButton)
          fireEvent.click(await screen.findByRole('button', { name: 'Confirm pipeline creation' }))
          await waitFor(() => expect(mocks.submitPipeline).toHaveBeenCalledOnce())
          expect(mocks.submitPipeline).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ ducklakeMode: 'supabase' }) })
          )
        } finally {
          response.resolve()
        }
      }
    )

    it.each(['pending', 'error', 'missing-version'] as const)(
      'allows custom submission while the project query is %s',
      async (queryState) => {
        const response = Promise.withResolvers<void>()
        addAPIMock({
          method: 'get',
          path: '/platform/projects/:ref',
          response: async () => {
            if (queryState === 'pending') await response.promise
            if (queryState === 'missing-version') {
              return HttpResponse.json<ProjectDetail>({ ...project, dbVersion: undefined })
            }
            return HttpResponse.json<APIErrorBody>(
              { message: 'Project details unavailable' },
              { status: 500 }
            )
          },
        })

        try {
          customRender(<DestinationForm selectedType="DuckLake" visible onClose={vi.fn()} />)
          if (queryState !== 'pending') {
            expect(
              await screen.findByText(
                queryState === 'error'
                  ? /Project details unavailable/
                  : /The project database version is unavailable/
              )
            ).toBeInTheDocument()
          }
          const submitButton = await fillDuckLakeForm()
          expect(screen.queryByText('Failed to load project')).not.toBeInTheDocument()
          fireEvent.click(submitButton)
          fireEvent.click(await screen.findByRole('button', { name: 'Confirm pipeline creation' }))
          await waitFor(() => expect(mocks.submitPipeline).toHaveBeenCalledOnce())
          expect(mocks.submitPipeline).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ ducklakeMode: 'custom' }) })
          )
        } finally {
          response.resolve()
        }
      }
    )

    it('rechecks the project before confirming managed pipeline creation', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref',
        response: () => HttpResponse.json<ProjectDetail>(project),
      })
      customRender(<DestinationForm selectedType="DuckLake" visible onClose={vi.fn()} />, {
        queryClient,
      })
      const submitButton = await fillDuckLakeForm()
      fireEvent.change(screen.getByLabelText('Configuration method'), {
        target: { value: 'supabase' },
      })
      await waitFor(() => expect(submitButton).toBeEnabled())
      fireEvent.click(submitButton)
      const confirmButton = await screen.findByRole('button', { name: 'Confirm pipeline creation' })

      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref',
        response: () =>
          HttpResponse.json<APIErrorBody>(
            { message: 'Project details unavailable' },
            { status: 500 }
          ),
      })
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: projectKeys.detail('project-ref') })
      })
      expect(await screen.findByText('Failed to load project')).toBeInTheDocument()
      fireEvent.click(confirmButton)

      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: 'Confirm pipeline creation' })
        ).not.toBeInTheDocument()
      )
      expect(mocks.submitPipeline).not.toHaveBeenCalled()
    })
  })

  it.each([
    { isPreviewEnabled: false, isEditing: false, shouldShowSection: false },
    { isPreviewEnabled: true, isEditing: false, shouldShowSection: true },
    { isPreviewEnabled: true, isEditing: true, shouldShowSection: false },
  ])(
    'shows the connection section only for preview creation ($isPreviewEnabled, $isEditing)',
    ({ isPreviewEnabled, isEditing, shouldShowSection }) => {
      mocks.isPreviewEnabled = isPreviewEnabled
      customRender(
        <DestinationForm
          selectedType="BigQuery"
          visible
          existingDestination={isEditing ? existingDestination : undefined}
          onClose={vi.fn()}
        />
      )
      expect(screen.queryByRole('region', { name: 'Destination review' }) !== null).toBe(
        shouldShowSection
      )
      expect(screen.queryByRole('region', { name: 'Data review' }) !== null).toBe(shouldShowSection)
      expect(screen.queryByRole('region', { name: 'Data' }) !== null).toBe(shouldShowSection)
      expect(screen.queryByRole('region', { name: 'Destination connection' }) !== null).toBe(
        shouldShowSection
      )
      if (shouldShowSection) {
        const section = screen.getByRole('region', { name: 'Destination connection' })
        expect(
          section.compareDocumentPosition(screen.getByRole('region', { name: 'Data' })) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
      }
    }
  )

  it.each([true, false])(
    'describes saving without claiming a stopped pipeline will start (enabled: %s)',
    (enabled) => {
      mocks.isSaving = true
      customRender(
        <DestinationForm
          selectedType="BigQuery"
          visible
          existingDestination={{
            ...existingDestination,
            enabled,
            statusName: enabled ? 'started' : 'stopped',
          }}
          onClose={vi.fn()}
        />
      )
      expect(
        screen.getByText(
          enabled ? 'Updating destination and restarting pipeline...' : 'Updating destination...'
        )
      ).toBeInTheDocument()
      expect(
        screen.queryByText('Updating destination and starting pipeline...')
      ).not.toBeInTheDocument()
    }
  )

  it.each([true, false])(
    'submits the pruned table policy with the existing batch (enabled: %s)',
    async (enabled) => {
      const destination = {
        ...existingDestination,
        enabled,
        statusName: enabled ? 'started' : 'stopped',
      }
      const onClose = vi.fn()

      customRender(
        <DestinationForm
          selectedType="BigQuery"
          visible
          existingDestination={destination}
          onClose={onClose}
        />
      )

      const submitButton = screen.getByRole('button', {
        name: enabled ? 'Apply and restart pipeline' : 'Apply changes',
      })
      await waitFor(() => expect(submitButton).toBeEnabled())
      fireEvent.click(submitButton)

      await waitFor(() => expect(mocks.submitPipeline).toHaveBeenCalledOnce())

      expect(mocks.validateConfiguration).not.toHaveBeenCalled()
      expect(mocks.submitPipeline).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tableSyncCopyMode: 'include_tables',
          tableSyncCopyTableIds: ['101'],
        }),
        existingDestination: destination,
        existingBatch,
        onSuccess: expect.any(Function),
        onClose,
      })
    }
  )

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

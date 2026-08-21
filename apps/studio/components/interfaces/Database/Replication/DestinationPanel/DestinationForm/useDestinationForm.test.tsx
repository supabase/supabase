import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { useDestinationForm } from './useDestinationForm'

const mocks = vi.hoisted(() => ({
  validateDestination: vi.fn(),
  validatePipeline: vi.fn(),
  createS3AccessKey: vi.fn(),
  createNamespace: vi.fn(),
  createDestinationPipeline: vi.fn(),
  updateDestinationPipeline: vi.fn(),
  startPipeline: vi.fn(),
  setRequestStatus: vi.fn(),
}))

vi.mock('common', () => ({ useParams: () => ({ ref: 'project-ref' }) }))
vi.mock('@/data/replication/sources-query', () => ({
  useReplicationSourcesQuery: () => ({
    data: { sources: [{ id: 42, name: 'project-ref' }] },
  }),
}))
vi.mock('@/data/replication/validate-destination-mutation', () => ({
  useValidateDestinationMutation: () => ({
    mutateAsync: mocks.validateDestination,
    isPending: false,
  }),
}))
vi.mock('@/data/replication/validate-pipeline-mutation', () => ({
  useValidatePipelineMutation: () => ({
    mutateAsync: mocks.validatePipeline,
    isPending: false,
  }),
}))
vi.mock('@/data/storage/s3-access-key-create-mutation', () => ({
  useS3AccessKeyCreateMutation: () => ({
    mutateAsync: mocks.createS3AccessKey,
    isPending: false,
  }),
}))
vi.mock('@/data/storage/iceberg-namespace-create-mutation', () => ({
  useIcebergNamespaceCreateMutation: () => ({
    mutateAsync: mocks.createNamespace,
    isPending: false,
  }),
}))
vi.mock('@/data/replication/create-destination-pipeline-mutation', () => ({
  useCreateDestinationPipelineMutation: () => ({
    mutateAsync: mocks.createDestinationPipeline,
    isPending: false,
  }),
}))
vi.mock('@/data/replication/update-destination-pipeline-mutation', () => ({
  useUpdateDestinationPipelineMutation: () => ({
    mutateAsync: mocks.updateDestinationPipeline,
    isPending: false,
  }),
}))
vi.mock('@/data/replication/start-pipeline-mutation', () => ({
  useStartPipelineMutation: () => ({
    mutateAsync: mocks.startPipeline,
    isPending: false,
  }),
}))
vi.mock('@/state/replication-pipeline-request-status', () => ({
  PipelineStatusRequestStatus: {
    RestartRequested: 'restart-requested',
    StartRequested: 'start-requested',
  },
  usePipelineRequestStatus: () => ({ setRequestStatus: mocks.setRequestStatus }),
}))

const formData = {
  name: 'Analytics',
  publicationName: 'analytics',
  tableSyncCopyMode: 'include_tables',
  tableSyncCopyTableIds: ['101'],
  maxFillMs: 500,
  projectId: 'example-project',
  datasetId: 'analytics',
  serviceAccountKey: '',
  connectionPoolSize: 5,
} as DestinationPanelSchemaType

describe('useDestinationForm validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.validateDestination.mockResolvedValue({ validation_failures: [] })
    mocks.validatePipeline.mockResolvedValue({ validation_failures: [] })
  })

  it('validates both destination and pipeline while creating', async () => {
    const { result } = renderHook(() => useDestinationForm({ selectedType: 'BigQuery' }))

    await act(async () => {
      await result.current.validateConfiguration({
        data: { ...formData, serviceAccountKey: '{"type":"service_account"}' },
        onValidationFail: vi.fn(),
      })
    })

    expect(mocks.validateDestination).toHaveBeenCalledOnce()
    expect(mocks.validatePipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef: 'project-ref',
        sourceId: 42,
        publicationName: 'analytics',
        tableSyncCopy: { type: 'include_tables', table_ids: [101] },
      })
    )
  })

  it('blocks creation when pipeline validation returns a critical failure', async () => {
    const failure = {
      failure_type: 'critical',
      name: 'Invalid table selection',
      reason: 'Refresh the publication selection.',
    }
    mocks.validatePipeline.mockResolvedValue({ validation_failures: [failure] })
    const onValidationFail = vi.fn()
    const { result } = renderHook(() => useDestinationForm({ selectedType: 'BigQuery' }))

    let validationResult: Awaited<ReturnType<typeof result.current.validateConfiguration>>
    await act(async () => {
      validationResult = await result.current.validateConfiguration({
        data: { ...formData, serviceAccountKey: '{"type":"service_account"}' },
        onValidationFail,
      })
    })

    expect(validationResult!).toEqual({ canContinue: false, warnings: [] })
    expect(onValidationFail).toHaveBeenCalledOnce()
  })

  it('preserves hidden batch fields and submits the selected table-copy policy on edit', async () => {
    const { result } = renderHook(() => useDestinationForm({ selectedType: 'BigQuery' }))

    await act(async () => {
      await result.current.submitPipeline({
        data: formData,
        existingDestination: {
          destinationId: 7,
          pipelineId: 8,
          enabled: true,
          statusName: 'started',
        },
        existingBatch: {
          max_fill_ms: 200,
          max_bytes: 8_388_608,
          memory_budget_ratio: 0.2,
        },
        onSuccess: vi.fn(),
        onClose: vi.fn(),
      })
    })

    expect(mocks.updateDestinationPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationId: 7,
        pipelineId: 8,
        pipelineConfig: expect.objectContaining({
          tableSyncCopy: { type: 'include_tables', table_ids: [101] },
          batch: {
            maxFillMs: 500,
            maxBytes: 8_388_608,
            memoryBudgetRatio: 0.2,
          },
        }),
      }),
      expect.any(Object)
    )
    expect(mocks.createDestinationPipeline).not.toHaveBeenCalled()
    expect(mocks.startPipeline).not.toHaveBeenCalled()
  })

  it('omits an unchanged batch when editing only the table-copy policy', async () => {
    const { result } = renderHook(() => useDestinationForm({ selectedType: 'BigQuery' }))

    await act(async () => {
      await result.current.submitPipeline({
        data: formData,
        existingDestination: {
          destinationId: 7,
          pipelineId: 8,
          enabled: true,
          statusName: 'started',
        },
        existingBatch: {
          max_fill_ms: formData.maxFillMs,
          max_bytes: 0,
          memory_budget_ratio: 2,
        },
        onSuccess: vi.fn(),
        onClose: vi.fn(),
      })
    })

    const updateParams = mocks.updateDestinationPipeline.mock.calls[0][0]
    expect(updateParams.pipelineConfig).toMatchObject({
      tableSyncCopy: { type: 'include_tables', table_ids: [101] },
    })
    expect(updateParams.pipelineConfig).not.toHaveProperty('batch')
  })
})

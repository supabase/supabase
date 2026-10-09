import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { useDestinationForm } from './useDestinationForm'
import { replicationKeys } from '@/data/replication/keys'
import {
  PipelineRequestStatusProvider,
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { customRenderHook, CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type ValidationResponse = components['schemas']['ValidatePipelineResponse_Output']
const updateRequests: unknown[] = []
const validationRequests: unknown[] = []
const startRequests = vi.fn()
const createRequests = vi.fn()
let validationResponse: ValidationResponse

const formData: DestinationPanelSchemaType = {
  name: 'Analytics',
  publicationName: 'analytics',
  tableSyncCopyMode: 'include_tables',
  tableSyncCopyTableIds: ['101'],
  maxFillMs: 500,
  maxTableSyncWorkers: 4,
  maxCopyConnectionsPerTable: 1,
  maxStalenessMins: 0,
  projectId: 'example-project',
  datasetId: 'analytics',
  serviceAccountKey: '',
  connectionPoolSize: 5,
}

const renderDestinationForm = async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = customRenderHook(
    () => ({
      ...useDestinationForm({ selectedType: 'BigQuery' }),
      requestStatus: usePipelineRequestStatus().getRequestStatus(8),
    }),
    {
      wrapper: ({ children }) => (
        <CustomWrapper queryClient={queryClient}>
          <PipelineRequestStatusProvider>{children}</PipelineRequestStatusProvider>
        </CustomWrapper>
      ),
    }
  )
  await waitFor(() =>
    expect(queryClient.getQueryState(replicationKeys.sources('default'))?.status).toBe('success')
  )
  return view
}

describe('useDestinationForm', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: ({ params }) =>
        HttpResponse.json<components['schemas']['PipelineStatusResponse_Output']>({
          pipeline_id: Number(params.pipeline_id),
          status: { name: 'stopped' },
        }),
    })
    updateRequests.length = 0
    validationRequests.length = 0
    startRequests.mockClear()
    createRequests.mockClear()
    validationResponse = { validation_failures: [] }
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources',
      response: () =>
        HttpResponse.json<components['schemas']['SourcesResponse_Output']>({
          sources: [
            {
              id: 42,
              name: 'default',
              tenant_id: 'tenant',
              config: {
                host: 'localhost',
                port: 5432,
                name: 'postgres',
                username: 'postgres',
              },
            },
          ],
        }),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/validate',
      response: async ({ request }) => {
        validationRequests.push(await request.json())
        return HttpResponse.json<ValidationResponse>(validationResponse)
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations/validate',
      response: () =>
        HttpResponse.json<components['schemas']['ValidateDestinationResponse_Output']>({
          validation_failures: [],
        }),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations-pipelines/:destination_id/:pipeline_id',
      response: async ({ request }) => {
        updateRequests.push(await request.json())
        return HttpResponse.json<Record<string, never>>({})
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/start',
      response: () => {
        startRequests()
        return HttpResponse.json<Record<string, never>>({})
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations-pipelines',
      response: () => {
        createRequests()
        return HttpResponse.json<components['schemas']['CreateDestinationPipelineResponse_Output']>(
          { pipeline_id: 8, destination_id: 7 }
        )
      },
    })
  })

  it('closes a committed creation even if its start request fails', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/start',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Start unavailable' }, { status: 503 }),
    })
    const { result } = await renderDestinationForm()
    const onClose = vi.fn()
    await act(async () => {
      await result.current.submitPipeline({
        data: { ...formData, serviceAccountKey: '{"type":"service_account"}' },
        onSuccess: vi.fn(),
        onClose,
      })
    })
    expect(createRequests).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    expect(result.current.requestStatus).toBe(PipelineStatusRequestStatus.None)
  })

  it('validates destination and pipeline configuration before creating', async () => {
    const { result } = await renderDestinationForm()
    await act(async () => {
      expect(
        await result.current.validateConfiguration({
          data: { ...formData, serviceAccountKey: '{"type":"service_account"}' },
          onValidationFail: vi.fn(),
        })
      ).toEqual({ canContinue: true, warnings: [] })
    })
    expect(validationRequests).toEqual([
      expect.objectContaining({
        source_id: 42,
        config: expect.objectContaining({
          publication_name: 'analytics',
          table_sync_copy: { type: 'include_tables', table_ids: [101] },
        }),
      }),
    ])
  })

  it('blocks creation when pipeline validation returns a critical failure', async () => {
    validationResponse = {
      validation_failures: [
        {
          failure_type: 'critical',
          name: 'Invalid table selection',
          reason: 'Refresh the publication selection.',
        },
      ],
    }
    const onValidationFail = vi.fn()
    const { result } = await renderDestinationForm()
    await act(async () => {
      expect(
        await result.current.validateConfiguration({
          data: { ...formData, serviceAccountKey: '{"type":"service_account"}' },
          onValidationFail,
        })
      ).toEqual({ canContinue: false, warnings: [] })
    })
    expect(onValidationFail).toHaveBeenCalledOnce()
  })

  it.each([true, false])(
    'preserves edit settings without an extra start (enabled: %s)',
    async (enabled) => {
      const { result } = await renderDestinationForm()
      const onClose = vi.fn()
      await act(async () => {
        await result.current.submitPipeline({
          data: formData,
          existingDestination: {
            destinationId: 7,
            pipelineId: 8,
            enabled,
            statusName: enabled ? 'started' : 'stopped',
          },
          existingBatch: { max_fill_ms: 200, max_bytes: 8_388_608, memory_budget_ratio: 0.2 },
          onSuccess: vi.fn(),
          onClose,
        })
      })
      expect(updateRequests).toEqual([
        expect.objectContaining({
          pipeline_config: expect.objectContaining({
            table_sync_copy: { type: 'include_tables', table_ids: [101] },
            batch: { max_fill_ms: 500, max_bytes: 8_388_608, memory_budget_ratio: 0.2 },
          }),
        }),
      ])
      expect(createRequests).not.toHaveBeenCalled()
      expect(startRequests).not.toHaveBeenCalled()
      expect(onClose).toHaveBeenCalledOnce()
      expect(result.current.requestStatus).toBe(PipelineStatusRequestStatus.None)
    }
  )

  it('omits an unchanged batch when editing only the table-copy policy', async () => {
    const { result } = await renderDestinationForm()
    await act(async () => {
      await result.current.submitPipeline({
        data: formData,
        existingDestination: {
          destinationId: 7,
          pipelineId: 8,
          enabled: true,
          statusName: 'started',
        },
        existingBatch: { max_fill_ms: formData.maxFillMs, max_bytes: 0, memory_budget_ratio: 2 },
        onSuccess: vi.fn(),
        onClose: vi.fn(),
      })
    })
    expect(updateRequests).toEqual([
      expect.objectContaining({
        pipeline_config: expect.not.objectContaining({ batch: expect.anything() }),
      }),
    ])
  })

  it('keeps the form open without requesting a restart when updating fails', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations-pipelines/:destination_id/:pipeline_id',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Update failed' }, { status: 503 }),
    })
    const { result } = await renderDestinationForm()
    const onClose = vi.fn()
    await act(async () => {
      await result.current.submitPipeline({
        data: formData,
        existingDestination: {
          destinationId: 7,
          pipelineId: 8,
          enabled: true,
          statusName: 'started',
        },
        onSuccess: vi.fn(),
        onClose,
      })
    })
    expect(onClose).not.toHaveBeenCalled()
    expect(startRequests).not.toHaveBeenCalled()
    expect(result.current.requestStatus).toBe(PipelineStatusRequestStatus.None)
  })
})

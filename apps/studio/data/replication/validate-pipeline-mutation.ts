import { components } from 'api-types'

import { type TableSyncCopyConfig } from './types'
import { useReplicationMutation } from './use-cluster-mutation'
import { buildPipelineApiConfig } from './utils'
import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

type ValidatePipelineParams = {
  projectRef: string
  sourceId: number
  publicationName: string
  maxFillMs?: number
  maxTableSyncWorkers?: number
  maxCopyConnectionsPerTable?: number
  invalidatedSlotBehavior?: 'error' | 'recreate'
  tableSyncCopy: TableSyncCopyConfig
  clusterId?: string
}
type ValidatePipelineResponse = components['schemas']['ValidatePipelineResponse_Output']

async function validatePipeline(
  {
    projectRef,
    sourceId,
    publicationName,
    maxFillMs,
    maxTableSyncWorkers,
    maxCopyConnectionsPerTable,
    invalidatedSlotBehavior,
    tableSyncCopy,
    clusterId,
  }: ValidatePipelineParams,
  signal?: AbortSignal
): Promise<ValidatePipelineResponse> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')

  const { data, error } = await post('/platform/replication/{ref}/pipelines/validate', {
    params: { path: { ref: projectRef }, query: { cluster_id: clusterId } },
    body: {
      source_id: sourceId,
      config: buildPipelineApiConfig({
        publicationName,
        maxTableSyncWorkers,
        maxCopyConnectionsPerTable,
        invalidatedSlotBehavior,
        tableSyncCopy,
        batch: maxFillMs === undefined ? undefined : { maxFillMs },
      }),
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type ValidatePipelineData = Awaited<ReturnType<typeof validatePipeline>>

export const useValidatePipelineMutation = (
  options?: Omit<
    UseCustomMutationOptions<ValidatePipelineData, StudioError, ValidatePipelineParams>,
    'mutationFn'
  >
) => {
  return useReplicationMutation<ValidatePipelineData, StudioError, ValidatePipelineParams>({
    mutationFn: (vars) => validatePipeline(vars),
    ...options,
  })
}

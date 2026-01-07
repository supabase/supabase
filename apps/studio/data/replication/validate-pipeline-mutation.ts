import { useMutation } from '@tanstack/react-query'
import { components } from 'api-types'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

type ValidatePipelineParams = {
  projectRef: string
  sourceId: number
  publicationName: string
  maxFillMs?: number
  maxSize?: number
  maxTableSyncWorkers?: number
}
type ValidatePipelineResponse = components['schemas']['ValidatePipelineResponse']

async function validatePipeline(
  {
    projectRef,
    sourceId,
    publicationName,
    maxFillMs,
    maxSize,
    maxTableSyncWorkers,
  }: ValidatePipelineParams,
  signal?: AbortSignal
): Promise<ValidatePipelineResponse> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')

  const { data, error } = await post('/platform/replication/{ref}/pipelines/validate', {
    params: { path: { ref: projectRef } },
    body: {
      source_id: sourceId,
      config: {
        publication_name: publicationName,
        ...(maxTableSyncWorkers !== undefined
          ? { max_table_sync_workers: maxTableSyncWorkers }
          : {}),
        ...(maxFillMs !== undefined || maxSize !== undefined
          ? {
              batch: {
                ...(maxFillMs !== undefined ? { max_fill_ms: maxFillMs } : {}),
                ...(maxSize !== undefined ? { max_size: maxSize } : {}),
              },
            }
          : {}),
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data as ValidatePipelineResponse
}

type ValidatePipelineData = Awaited<ReturnType<typeof validatePipeline>>

export const useValidatePipelineMutation = (
  options?: Omit<
    UseCustomMutationOptions<ValidatePipelineData, ResponseError, ValidatePipelineParams>,
    'mutationFn'
  >
) => {
  return useMutation<ValidatePipelineData, ResponseError, ValidatePipelineParams>({
    mutationFn: (vars) => validatePipeline(vars),
    ...options,
  })
}

import { useMutation } from '@tanstack/react-query'
import type { components } from 'api-types'

import {
  buildCreateDestinationApiConfig,
  buildPipelineApiConfig,
  DestinationConfig,
  TableSyncCopyConfig,
} from './create-destination-pipeline-mutation'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type ValidateDestinationParams = {
  projectRef: string
  destinationConfig: DestinationConfig
  sourceId?: number
  publicationName?: string
  maxFillMs?: number
  maxTableSyncWorkers?: number
  maxCopyConnectionsPerTable?: number
  invalidatedSlotBehavior?: 'error' | 'recreate'
  tableSyncCopy?: TableSyncCopyConfig
}

type ValidateDestinationResponse = components['schemas']['ValidateDestinationResponse']
export type ValidationFailure = ValidateDestinationResponse['validation_failures'][number]

async function validateDestination(
  {
    projectRef,
    destinationConfig,
    sourceId,
    publicationName,
    maxFillMs,
    maxTableSyncWorkers,
    maxCopyConnectionsPerTable,
    invalidatedSlotBehavior,
    tableSyncCopy,
  }: ValidateDestinationParams,
  signal?: AbortSignal
): Promise<ValidateDestinationResponse> {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/destinations/validate', {
    params: { path: { ref: projectRef } },
    body: {
      config: buildCreateDestinationApiConfig(destinationConfig),
      source_id: sourceId,
      pipeline_config:
        publicationName === undefined
          ? undefined
          : buildPipelineApiConfig({
              publicationName,
              maxTableSyncWorkers,
              maxCopyConnectionsPerTable,
              invalidatedSlotBehavior,
              tableSyncCopy: tableSyncCopy ?? { type: 'include_all_tables' },
              batch: maxFillMs === undefined ? undefined : { maxFillMs },
            }),
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type ValidateDestinationData = Awaited<ReturnType<typeof validateDestination>>

export const useValidateDestinationMutation = (
  options?: Omit<
    UseCustomMutationOptions<ValidateDestinationData, ResponseError, ValidateDestinationParams>,
    'mutationFn'
  >
) => {
  return useMutation<ValidateDestinationData, ResponseError, ValidateDestinationParams>({
    mutationFn: (vars) => validateDestination(vars),
    ...options,
  })
}

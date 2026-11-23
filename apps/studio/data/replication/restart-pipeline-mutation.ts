import { useQueryClient } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { useReplicationMutation } from './use-cluster-mutation'
import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type RestartPipelineParams = {
  projectRef: string
  pipelineId: string
  clusterId?: string
}

export async function restartPipeline(
  { projectRef, pipelineId, clusterId }: RestartPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/pipelines/{pipeline_id}/restart',
    {
      params: {
        path: { ref: projectRef, pipeline_id: pipelineId },
        query: { cluster_id: clusterId },
      },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

type RestartPipelineData = Awaited<ReturnType<typeof restartPipeline>>

export const useRestartPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<RestartPipelineData, StudioError, RestartPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useReplicationMutation<RestartPipelineData, StudioError, RestartPipelineParams>({
    mutationFn: (vars) => restartPipeline(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, pipelineId } = variables

      await queryClient.invalidateQueries(
        {
          queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId, variables.clusterId),
        },
        { cancelRefetch: false }
      )

      await onSuccess?.(data, variables, context)
    },
    // No default error toast here: callers already show one from their try/catch around
    // mutateAsync, so a default here would double up. onError is only for opt-in callers.
    async onError(data, variables, context) {
      await queryClient.invalidateQueries(
        {
          queryKey: replicationKeys.pipelinesStatus(
            variables.projectRef,
            variables.pipelineId,
            variables.clusterId
          ),
        },
        { cancelRefetch: false }
      )

      await onError?.(data, variables, context)
    },
    ...options,
  })
}

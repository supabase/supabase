import { useMutation, useQueryClient } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type RestartPipelineParams = {
  projectRef: string
  pipelineId: number
}

export async function restartPipeline(
  { projectRef, pipelineId }: RestartPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/pipelines/{pipeline_id}/restart',
    {
      params: { path: { ref: projectRef, pipeline_id: pipelineId } },
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
  UseCustomMutationOptions<RestartPipelineData, ResponseError, RestartPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<RestartPipelineData, ResponseError, RestartPipelineParams>({
    mutationFn: (vars) => restartPipeline(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, pipelineId } = variables

      await queryClient.invalidateQueries({
        queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
      })

      // [Joshen] We're manually updating the query client here as the pipeline status is async
      // So setting it so starting while letting long poll update the actual status thereafter
      queryClient.setQueriesData(
        {
          queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
          exact: true,
        },
        (prev) => {
          if (!prev) return prev
          return { ...prev, status: { name: 'starting' } }
        }
      )

      await onSuccess?.(data, variables, context)
    },
    // No default error toast here: callers already show one from their try/catch around
    // mutateAsync, so a default here would double up. onError is only for opt-in callers.
    async onError(data, variables, context) {
      await onError?.(data, variables, context)
    },
    ...options,
  })
}

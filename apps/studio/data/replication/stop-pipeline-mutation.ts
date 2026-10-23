import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { waitForPipelineStopped } from './pipeline-status-query'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type StopPipelineParams = {
  projectRef: string
  pipelineId: number
  waitUntilStopped?: boolean
}

export async function stopPipeline(
  { projectRef, pipelineId }: StopPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/pipelines/{pipeline_id}/stop', {
    params: { path: { ref: projectRef, pipeline_id: pipelineId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type StopPipelineData = Awaited<ReturnType<typeof stopPipeline>>

export const useStopPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<StopPipelineData, ResponseError, StopPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<StopPipelineData, ResponseError, StopPipelineParams>({
    mutationFn: async (variables) => {
      const data = await stopPipeline(variables)
      if (variables.waitUntilStopped) await waitForPipelineStopped(queryClient, variables)
      return data
    },
    async onSuccess(data, variables, context) {
      const { projectRef, pipelineId } = variables
      await queryClient.invalidateQueries(
        {
          queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
        },
        { cancelRefetch: false }
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      await queryClient.invalidateQueries(
        {
          queryKey: replicationKeys.pipelinesStatus(variables.projectRef, variables.pipelineId),
        },
        { cancelRefetch: false }
      )

      if (onError === undefined) {
        toast.error(`Failed to stop pipeline: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

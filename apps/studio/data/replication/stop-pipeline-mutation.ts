import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type StopPipelineParams = {
  projectRef: string
  pipelineId: number
}

async function stopPipeline({ projectRef, pipelineId }: StopPipelineParams, signal?: AbortSignal) {
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

type StartPipelineData = Awaited<ReturnType<typeof stopPipeline>>

export const useStopPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<StartPipelineData, ResponseError, StopPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<StartPipelineData, ResponseError, StopPipelineParams>(
    (vars) => stopPipeline(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, pipelineId } = variables
        await queryClient.invalidateQueries(replicationKeys.pipelinesStatus(projectRef, pipelineId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to stop pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

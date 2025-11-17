import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { replicationKeys } from './keys'

export type StartPipelineParams = {
  projectRef: string
  pipelineId: number
}

async function startPipeline(
  { projectRef, pipelineId }: StartPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/pipelines/{pipeline_id}/start', {
    params: { path: { ref: projectRef, pipeline_id: pipelineId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type StartPipelineData = Awaited<ReturnType<typeof startPipeline>>

export const useStartPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<StartPipelineData, ResponseError, StartPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<StartPipelineData, ResponseError, StartPipelineParams>({
    mutationFn: (vars) => startPipeline(vars),
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
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to start pipeline: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

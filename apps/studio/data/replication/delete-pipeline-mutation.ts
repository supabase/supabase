import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, del } from 'data/fetchers'

export type DeletePipelineParams = {
  projectRef: string
  pipelineId: number
}

async function deletePipeline(
  { projectRef, pipelineId }: DeletePipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/platform/replication/{ref}/pipelines/{pipeline_id}', {
    params: { path: { ref: projectRef, pipeline_id: pipelineId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type DeletePipelineData = Awaited<ReturnType<typeof deletePipeline>>

export const useDeletePipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeletePipelineData, ResponseError, DeletePipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeletePipelineData, ResponseError, DeletePipelineParams>(
    (vars) => deletePipeline(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(replicationKeys.pipelines(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

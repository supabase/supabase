import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type UpdatePipelineParams = {
  pipelineId: number
  projectRef: string
  sourceId: number
  sinkId: number
  publicationName: string
  config: { config: { maxSize: number; maxFillSecs: number } }
}

async function updatePipeline(
  {
    pipelineId,
    projectRef,
    sourceId,
    sinkId,
    publicationName,
    config: {
      config: { maxSize, maxFillSecs },
    },
  }: UpdatePipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/pipelines/{pipeline_id}', {
    params: { path: { ref: projectRef, pipeline_id: pipelineId } },
    body: {
      source_id: sourceId,
      sink_id: sinkId,
      publication_name: publicationName,
      config: { config: { max_size: maxSize, max_fill_secs: maxFillSecs } },
    },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type UpdatePipelineData = Awaited<ReturnType<typeof updatePipeline>>

export const useUpdatePipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdatePipelineData, ResponseError, UpdatePipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdatePipelineData, ResponseError, UpdatePipelineParams>(
    (vars) => updatePipeline(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(replicationKeys.pipelines(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

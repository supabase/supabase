import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type CreatePipelineParams = {
  projectRef: string
  sourceId: number
  sinkId: number
  publicationName: string
  config: { config: { maxSize: number; maxFillSecs: number } }
}

async function createPipeline(
  {
    projectRef,
    sourceId,
    sinkId,
    publicationName,
    config: {
      config: { maxSize, maxFillSecs },
    },
  }: CreatePipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/pipelines', {
    params: { path: { ref: projectRef } },
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

type CreatePipelineData = Awaited<ReturnType<typeof createPipeline>>

export const useCreatePipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CreatePipelineData, ResponseError, CreatePipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreatePipelineData, ResponseError, CreatePipelineParams>(
    (vars) => createPipeline(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(replicationKeys.pipelines(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

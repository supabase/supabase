import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type CreateSinkParams = {
  projectRef: string
  sinkName: string
  projectId: string
  datasetId: string
  serviceAccountKey: string
  maxStalenessMins: number
}

async function createSink(
  {
    projectRef,
    sinkName,
    projectId,
    datasetId,
    serviceAccountKey,
    maxStalenessMins,
  }: CreateSinkParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/sinks', {
    params: { path: { ref: projectRef } },
    body: {
      project_id: projectId,
      dataset_id: datasetId,
      service_account_key: serviceAccountKey,
      sink_name: sinkName,
      max_staleness_mins: maxStalenessMins,
    },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type CreateSinkData = Awaited<ReturnType<typeof createSink>>

export const useCreateSinkMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CreateSinkData, ResponseError, CreateSinkParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateSinkData, ResponseError, CreateSinkParams>((vars) => createSink(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(replicationKeys.sinks(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create sink: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

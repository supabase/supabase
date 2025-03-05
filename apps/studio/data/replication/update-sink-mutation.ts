import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type UpdateSinkParams = {
  sinkId: number
  projectRef: string
  sinkName: string
  projectId: string
  datasetId: string
  serviceAccountKey: string
  maxStalenessMins: number
}

async function updateSink(
  {
    sinkId,
    projectRef,
    sinkName,
    projectId,
    datasetId,
    serviceAccountKey,
    maxStalenessMins,
  }: UpdateSinkParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/sinks/{sink_id}', {
    params: { path: { ref: projectRef, sink_id: sinkId } },
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

type UpdateSinkData = Awaited<ReturnType<typeof updateSink>>

export const useUpdateSinkMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateSinkData, ResponseError, UpdateSinkParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateSinkData, ResponseError, UpdateSinkParams>((vars) => updateSink(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(replicationKeys.sinks(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update sink: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

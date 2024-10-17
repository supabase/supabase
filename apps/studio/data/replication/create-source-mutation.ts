import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type CreateSourceParams = {
  projectRef: string
}

async function createSource({ projectRef }: CreateSourceParams, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/sources', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type CreateSourceData = Awaited<ReturnType<typeof createSource>>

export const useCreateSourceMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CreateSourceData, ResponseError, CreateSourceParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateSourceData, ResponseError, CreateSourceParams>(
    (vars) => createSource(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(replicationKeys.sources(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create source: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

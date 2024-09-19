import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { analyticsKeys } from './keys'

export type DeleteCollectionVariables = {
  projectRef: string
  collectionToken: string
}

export async function deleteCollection({ projectRef, collectionToken }: DeleteCollectionVariables) {
  const { data, error } = await del(
    '/platform/projects/{ref}/analytics/warehouse/collections/{token}',
    {
      params: { path: { ref: projectRef, token: collectionToken } } as any,
    }
  )

  if (error) handleError(error)
  return data
}

type DeleteCollectionData = Awaited<ReturnType<typeof deleteCollection>>

export const useDeleteCollectionMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeleteCollectionData, ResponseError, DeleteCollectionVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteCollectionData, ResponseError, DeleteCollectionVariables>(
    (vars) => deleteCollection(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(analyticsKeys.warehouseCollections(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete collection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, del } from 'data/fetchers'
import type { ResponseError } from 'types'
import { analyticsKeys } from './keys'

export type DeleteCollectionArgs = {
  projectRef: string
  collectionToken: string
}

export async function deleteCollection({ projectRef, collectionToken }: DeleteCollectionArgs) {
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
  UseMutationOptions<DeleteCollectionData, ResponseError, DeleteCollectionArgs>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteCollectionData, ResponseError, DeleteCollectionArgs>(
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

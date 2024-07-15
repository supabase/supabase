import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { analyticsKeys } from './keys'

export type UpdateCollectionArgs = {
  projectRef: string
  collectionToken: string
}

export type UpdateCollectionPayload = {
  name?: string
  // description?: string
}

export async function updateCollection(
  { projectRef, collectionToken }: UpdateCollectionArgs,
  payload: UpdateCollectionPayload
) {
  const { data, error } = await patch(
    '/platform/projects/{ref}/analytics/warehouse/collections/{token}',
    {
      params: { path: { ref: projectRef, token: collectionToken } },
      body: payload,
    } as any
  )

  if (error) handleError(error)
  return data
}

type UpdateCollectionData = Awaited<ReturnType<typeof updateCollection>>

export const useUpdateCollection = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateCollectionData, ResponseError, UpdateCollectionPayload>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateCollectionData,
    ResponseError,
    UpdateCollectionPayload & UpdateCollectionArgs
  >(
    (payload) =>
      updateCollection(
        { projectRef: payload.projectRef, collectionToken: payload.collectionToken },
        { name: payload.name }
      ),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(analyticsKeys.warehouseCollections(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update collection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

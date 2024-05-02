import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { patch } from 'data/fetchers'

type UpdateCollectionArgs = {
  projectRef: string
  collectionToken: string
}
type UpdateCollectionPayload = {
  name?: string
  // description?: string
}
export function useUpdateCollection({ projectRef, collectionToken }: UpdateCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (payload: UpdateCollectionPayload) => {
      await patch(`/platform/projects/{ref}/analytics/warehouse/collections/{token}`, {
        params: {
          path: { ref: projectRef, token: collectionToken },
        },
        body: payload,
      } as any) // TODO: remove cast when openapi client generates correct types
      const keysToInvalidate = analyticsKeys.warehouseCollections(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
    mutationKey: analyticsKeys.warehouseCollections(projectRef),
  })

  return mutation
}

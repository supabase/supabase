import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { patch } from 'data/fetchers'

type UpdateCollectionArgs = {
  projectRef: string,
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
      const resp = await patch(`/platform/projects/${projectRef}/analytics/warehouse/collections/${collectionToken}`, {body: payload})
      const keysToInvalidate = analyticsKeys.warehouseCollections(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
    mutationKey: analyticsKeys.warehouseCollections(projectRef)
  })

  return mutation
}

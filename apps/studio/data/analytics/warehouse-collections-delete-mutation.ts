import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { del } from 'data/fetchers'

type DeleteCollectionArgs = {
  projectRef: string
  collectionToken: string
}
export function useDeleteCollection({ projectRef, collectionToken }: DeleteCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      const resp = await del(`/platform/projects/${projectRef}/analytics/warehouse/collections/${collectionToken}`, {})

      const keysToInvalidate = analyticsKeys.warehouseCollections(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
    mutationKey: analyticsKeys.warehouseCollections(projectRef),
  })

  return mutation
}

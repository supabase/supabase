import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { del } from 'data/fetchers'

type DeleteCollectionArgs = {
  projectRef: string
  collectionToken: string
  onSuccess: () => void
}
export function useDeleteCollection({
  projectRef,
  collectionToken,
  onSuccess,
}: DeleteCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      await del(
        `/platform/projects/${projectRef}/analytics/warehouse/collections/${collectionToken}`,
        {}
      )

      const keysToInvalidate = analyticsKeys.warehouseCollections(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
    mutationKey: analyticsKeys.warehouseCollections(projectRef),
    onSuccess,
  })

  return mutation
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { post } from 'data/fetchers'

type CreateCollectionArgs = {
  projectRef: string
}
type CreateCollectionPayload = {
  name: string
  id: string
  token: string
}
export function useCreateCollection({ projectRef }: CreateCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (payload: CreateCollectionPayload) => {
      const tenantRes = await post(`/platform/projects/{ref}/analytics/warehouse/tenant`, {
        params: {
          path: { ref: projectRef },
        },
      })
      console.log('DEBUG TENANT', tenantRes.data)

      const res = await post(`/platform/projects/{ref}/analytics/warehouse/collections`, {
        params: {
          path: { ref: projectRef },
        },
        body: payload as any,
      })

      const keysToInvalidate = analyticsKeys.warehouseCollections(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
      return res
    },
    mutationKey: analyticsKeys.warehouseCollections(projectRef),
  })

  return mutation
}

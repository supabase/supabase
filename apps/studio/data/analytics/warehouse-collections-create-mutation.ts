import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { post } from 'data/fetchers'

type CreateCollectionArgs = {
  projectRef: string
}
type CreateCollectionPayload = {
  name: string
  description?: string
}
export function useCreateCollection({ projectRef }: CreateCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (payload: CreateCollectionPayload) => {
      console.log('payload', payload)
      const resp = await post(`/platform/projects/${projectRef}/analytics/warehouse/collections`, {body: payload})
      console.log({resp})

      const keysToInvalidate = analyticsKeys.warehouseCollections(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
      return resp
    },
    mutationKey: analyticsKeys.warehouseCollections(projectRef),
  })

  return mutation
}

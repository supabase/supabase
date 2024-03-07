import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { post } from 'common/fetchWrappers'


type CreateCollectionArgs = {
  projectRef: string,
}
type CreateCollectionPayload = {
  name: string
  description?: string
}
export function useCreateCollection({ projectRef }: CreateCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (payload: CreateCollectionPayload) => {
      // mock collection
      console.log(projectRef)
      const resp =  await post(`/project/${projectRef}/analytics/warehouse/collections`,payload)
      console.log(resp)
      return resp
    },
    mutationKey: analyticsKeys.warehouseCollectionsCreate(projectRef),
  })

  return mutation
}

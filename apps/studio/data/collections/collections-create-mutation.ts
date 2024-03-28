import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionKeys } from './keys'

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
      // mock collection
      const collection = {
        id: '4',
        name: payload.name,
        description: payload.description,
      }

      // mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const keysToInvalidate = collectionKeys.list(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)

      return collection
    },
    mutationKey: collectionKeys.create(projectRef),
  })

  return mutation
}

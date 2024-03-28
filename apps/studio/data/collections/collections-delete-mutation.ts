import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionKeys } from './keys'

type DeleteCollectionArgs = {
  projectRef: string
}
type DeleteCollectionPayload = {
  id: string
}
export function useDeleteCollection({ projectRef }: DeleteCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (payload: DeleteCollectionPayload) => {
      // To do: Implement the collection deletion logic here

      // mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const keysToInvalidate = collectionKeys.list(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
    mutationKey: collectionKeys.create(projectRef),
  })

  return mutation
}

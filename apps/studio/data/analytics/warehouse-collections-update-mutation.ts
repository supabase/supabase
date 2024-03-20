import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collectionKeys } from './keys'

type UpdateCollectionArgs = {
  projectRef: string
}
type UpdateCollectionPayload = {
  name?: string
  description?: string
}
export function useUpdateCollection({ projectRef }: UpdateCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (payload: UpdateCollectionPayload) => {
      // To do: Implement the collection creation logic here

      // mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const keysToInvalidate = collectionKeys.list(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
    mutationKey: collectionKeys.create(projectRef),
  })

  return mutation
}

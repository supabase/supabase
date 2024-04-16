import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { post } from 'data/fetchers'

type CreateCollectionPayload = {
  name: string
  id: string
  token: string
}
async function createCollection(ref: string, payload: CreateCollectionPayload) {
  await post(`/platform/projects/{ref}/analytics/warehouse/tenant`, {
    params: {
      path: { ref },
    },
  })

  const res = await post(`/platform/projects/{ref}/analytics/warehouse/collections`, {
    params: {
      path: { ref },
    },
    body: payload,
  })

  return res
}

type CreateCollectionArgs = {
  projectRef: string
  onSuccess: (data: Awaited<ReturnType<typeof createCollection>>) => void
}

export function useCreateCollection({ projectRef, onSuccess }: CreateCollectionArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateCollectionPayload) => createCollection(projectRef, payload),
    mutationKey: analyticsKeys.warehouseCollections(projectRef),
    onSuccess: (data) => {
      onSuccess(data)
      const keysToInvalidate = analyticsKeys.warehouseCollections(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
  })

  return mutation
}

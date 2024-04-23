import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { post } from 'data/fetchers'

type CreateWarehouseAccessToken = {
  name: string
}
async function createWarehouseAccessToken(ref: string, payload: CreateWarehouseAccessToken) {
  const res = await post(`/platform/projects/{ref}/analytics/warehouse/access-tokens`, {
    params: {
      path: { ref },
    },
    body: payload,
  })

  // TODO: remove cast when openapi client generates correct types
  return res as any as {
    id: string
    token: string
    scopes: string
    inserted_at: string
    description?: string
  }
}

type CreateAccessTokenArgs = {
  projectRef: string
  onSuccess: (data: Awaited<ReturnType<typeof createWarehouseAccessToken>>) => void
}

export function useCreateWarehouseAccessToken({ projectRef, onSuccess }: CreateAccessTokenArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateWarehouseAccessToken) =>
      createWarehouseAccessToken(projectRef, payload),
    mutationKey: analyticsKeys.warehouseCollections(projectRef),
    onSuccess: (data) => {
      onSuccess(data)
      const keysToInvalidate = analyticsKeys.warehouseAccessTokens(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
  })

  return mutation
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { del } from 'data/fetchers'

async function deleteWarehouseAccessToken(ref: string, token: string) {
  const res = await del(`/platform/projects/{ref}/analytics/warehouse/access-tokens/{token}`, {
    params: {
      path: { ref, token },
    },
  })

  if (res.error) {
    console.error(res.error)
    throw res.error
  }

  return res
}

type DeleteAccessTokenArgs = {
  projectRef: string
  onSuccess: (data: Awaited<ReturnType<typeof deleteWarehouseAccessToken>>) => void
  onError: (error: any) => void
}

export function useDeleteWarehouseAccessToken({
  projectRef,
  onSuccess,
  onError,
}: DeleteAccessTokenArgs) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (token: string) => deleteWarehouseAccessToken(projectRef, token),
    mutationKey: analyticsKeys.warehouseCollections(projectRef),
    onSuccess: (data) => {
      onSuccess(data)
      const keysToInvalidate = analyticsKeys.warehouseAccessTokens(projectRef)
      queryClient.invalidateQueries(keysToInvalidate)
    },
    onError,
  })

  return mutation
}

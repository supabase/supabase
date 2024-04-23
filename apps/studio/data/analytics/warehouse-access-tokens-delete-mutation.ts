import { useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { del } from 'data/fetchers'

async function deleteWarehouseAccessToken(ref: string, tokenId: string) {
  const res = await del(`/platform/projects/{ref}/analytics/warehouse/access-tokens/{tokenId}`, {
    params: {
      path: { ref, tokenId },
    },
  })

  if (res.error) {
    console.error(error)
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
    mutationFn: (tokenId: string) => deleteWarehouseAccessToken(projectRef, tokenId),
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

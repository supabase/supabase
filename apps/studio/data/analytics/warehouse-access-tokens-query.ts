import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'

export type WarehouseAccessTokensVariables = {
  projectRef: string
}

export async function getWarehouseAccessTokens(
  { projectRef }: WarehouseAccessTokensVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  // TODO: Remove typecast when codegen types are fixed
  const response = await get(`/platform/projects/{ref}/analytics/warehouse/access-tokens`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (response.error) {
    handleError(response)
  }

  return response
}

export type WarehouseAccessTokensData = Awaited<ReturnType<typeof getWarehouseAccessTokens>>
export type WarehouseAccessTokensError = ResponseError

export const useWarehouseAccessTokensQuery = <TData = WarehouseAccessTokensData>(
  { projectRef }: WarehouseAccessTokensVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WarehouseAccessTokensData, WarehouseAccessTokensError, TData> = {}
) =>
  useQuery<WarehouseAccessTokensData, WarehouseAccessTokensError, TData>(
    analyticsKeys.warehouseAccessTokens(projectRef),
    ({ signal }) => getWarehouseAccessTokens({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

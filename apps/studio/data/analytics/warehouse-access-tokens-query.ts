import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type WarehouseAccessTokensVariables = {
  projectRef: string
}

export type WarehouseAccessTokensResponse = any

export async function getWarehouseAccessTokens(
  { projectRef }: WarehouseAccessTokensVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get<WarehouseAccessTokensResponse>(
    `${API_URL}/projects/${projectRef}/analytics/warehouse/access-tokens`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

export type WarehouseAccessTokensData = Awaited<ReturnType<typeof getWarehouseAccessTokens>>
export type WarehouseAccessTokensError = unknown

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

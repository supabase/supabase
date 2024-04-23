import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { get } from 'data/fetchers'

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

  const response = await get(`/platform/projects/{ref}/analytics/warehouse/access-tokens`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  // TODO: remove cast when openapi client generates correct types
  return response as any as {
    data: {
      id: string
      token: string
      scopes: string
      inserted_at: string
      description?: string
    }[]
  }
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

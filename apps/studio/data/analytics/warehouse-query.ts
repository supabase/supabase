import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type WarehouseQueryVariables = {
  ref: string
  sql: string
}

export async function getWarehouseQuery(
  { ref, sql }: WarehouseQueryVariables,
  signal?: AbortSignal
) {
  if (!ref) {
    throw new Error('ref is required')
  }
  if (!sql) {
    throw new Error('SQL must be provided')
  }

  const response = await get(`/platform/projects/{ref}/analytics/warehouse/query`, {
    params: { path: { ref: ref }, query: { bq_sql: sql } },
    signal,
  })

  return response
}

export type WarehouseQueryData = Awaited<ReturnType<typeof getWarehouseQuery>>
export type WarehouseQueryError = unknown

export const useWarehouseQueryQuery = <TData = WarehouseQueryData>(
  { ref, sql }: WarehouseQueryVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WarehouseQueryData, WarehouseQueryError, TData> = {}
) =>
  useQuery<WarehouseQueryData, WarehouseQueryError, TData>(
    analyticsKeys.warehouseQuery(ref, sql),
    ({ signal }) => getWarehouseQuery({ ref, sql }, signal),
    {
      enabled: enabled && typeof ref !== 'undefined',
      staleTime: Infinity,
      // 15 mins cache time
      cacheTime: 15 * 60 * 1000,
      refetchOnMount: false,
      refetchInterval: false,
      ...options,
    }
  )

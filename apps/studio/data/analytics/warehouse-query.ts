import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'
import { ResponseError } from 'types'

export type WarehouseQueryVariables = {
  ref: string
  sql: string
}

export async function getWarehouseQuery(
  { ref, sql }: WarehouseQueryVariables,
  signal?: AbortSignal
) {
  if (!sql) {
    throw new Error('SQL must be provided')
  }

  const { data, error } = await get(`/platform/projects/{ref}/analytics/warehouse/query`, {
    params: { path: { ref: ref }, query: { bq_sql: sql } },
    signal,
  } as any)

  if (error) {
    handleError(error)
  }

  // TODO!: Remove type assertion when we have a proper type for the response
  return data as { result: any[] }
}

export type WarehouseQueryData = Awaited<ReturnType<typeof getWarehouseQuery>>
export type WarehouseQueryError = ResponseError

export const useWarehouseQueryQuery = <TData = WarehouseQueryData>(
  { ref, sql }: WarehouseQueryVariables,
  { enabled, ...options }: UseQueryOptions<WarehouseQueryData, WarehouseQueryError, TData> = {}
) =>
  useQuery<WarehouseQueryData, WarehouseQueryError, TData>(
    analyticsKeys.warehouseQuery(ref, sql),
    ({ signal }) => getWarehouseQuery({ ref, sql }, signal),
    {
      enabled,
      staleTime: Infinity,
      cacheTime: 15 * 60 * 1000, // 15 mins cache time
      refetchOnMount: false,
      refetchInterval: false,
      ...options,
    }
  )

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type WarehouseQueryVariables = {
  projectRef: string
  sql: string
}

export type WarehouseQueryResponse = any

export async function getWarehouseQuery(
  { projectRef, sql }: WarehouseQueryVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!sql) {
    throw new Error('SQL must be provided')
  }

  const response = await get<WarehouseQueryResponse>(
    `/platform/projects/{ref}/analytics/warehouse/query`,
    {
      params: { path: { ref: projectRef }, query: { bq_sql: sql } },
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

export type WarehouseQueryData = Awaited<ReturnType<typeof getWarehouseQuery>>
export type WarehouseQueryError = unknown

export const useWarehouseQueryQuery = <TData = WarehouseQueryData>(
  { projectRef, sql }: WarehouseQueryVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WarehouseQueryData, WarehouseQueryError, TData> = {}
) =>
  useQuery<WarehouseQueryData, WarehouseQueryError, TData>(
    analyticsKeys.warehouseQuery(projectRef, sql),
    ({ signal }) => getWarehouseQuery({ projectRef, sql }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

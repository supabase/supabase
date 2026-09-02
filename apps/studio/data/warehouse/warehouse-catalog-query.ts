import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { warehouseKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type WarehouseCatalogResponse = components['schemas']['WarehouseCatalogResponse']

type WarehouseCatalogVariables = { projectRef?: string }

async function getWarehouseCatalog(
  { projectRef }: WarehouseCatalogVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/warehouse/{ref}/catalog', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type WarehouseCatalogData = Awaited<ReturnType<typeof getWarehouseCatalog>>

export const useWarehouseCatalogQuery = <TData = WarehouseCatalogData>(
  { projectRef }: WarehouseCatalogVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WarehouseCatalogData, ResponseError, TData> = {}
) =>
  useQuery<WarehouseCatalogData, ResponseError, TData>({
    queryKey: warehouseKeys.catalog(projectRef),
    queryFn: ({ signal }) => getWarehouseCatalog({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

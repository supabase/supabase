import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { warehouseKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse']

type WarehouseSetupStatusVariables = { projectRef?: string }

async function getWarehouseSetupStatus(
  { projectRef }: WarehouseSetupStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/warehouse/{ref}/setup-status', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type WarehouseSetupStatusData = Awaited<ReturnType<typeof getWarehouseSetupStatus>>

export const useWarehouseSetupStatusQuery = <TData = WarehouseSetupStatusData>(
  { projectRef }: WarehouseSetupStatusVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WarehouseSetupStatusData, ResponseError, TData> = {}
) =>
  useQuery<WarehouseSetupStatusData, ResponseError, TData>({
    queryKey: warehouseKeys.setupStatus(projectRef),
    queryFn: ({ signal }) => getWarehouseSetupStatus({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

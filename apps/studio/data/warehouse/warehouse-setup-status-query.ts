import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { warehouseKeys } from './keys'
import {
  WAREHOUSE_SETUP_IN_PROGRESS_STATUSES,
  type WarehouseSetupStatusResponse,
} from './warehouse-types'
import { fetchGet } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { ResponseError } from '@/types'

export type WarehouseSetupStatusVariables = { projectRef?: string }
export type WarehouseSetupStatusData = WarehouseSetupStatusResponse
export type WarehouseSetupStatusError = ResponseError

export async function getWarehouseSetupStatus(
  { projectRef }: WarehouseSetupStatusVariables,
  signal?: AbortSignal
): Promise<WarehouseSetupStatusData> {
  if (!projectRef) throw new Error('projectRef is required')

  const result = await fetchGet<WarehouseSetupStatusResponse>(
    `${API_URL?.replace('/platform', '')}/platform/warehouse/${projectRef}/setup-status`,
    { abortSignal: signal, credentials: 'include' }
  )
  if (result instanceof ResponseError) throw result
  return result
}

export const useWarehouseSetupStatusQuery = <TData = WarehouseSetupStatusData>(
  { projectRef }: WarehouseSetupStatusVariables,
  {
    enabled = true,
    ...options
  }: Omit<
    UseQueryOptions<WarehouseSetupStatusData, WarehouseSetupStatusError, TData>,
    'queryKey'
  > = {}
) =>
  useQuery<WarehouseSetupStatusData, WarehouseSetupStatusError, TData>({
    queryKey: warehouseKeys.setupStatus(projectRef),
    queryFn: ({ signal }) => getWarehouseSetupStatus({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    // Setup runs asynchronously in the worker (pipeline → copy → FDW install). Poll while a phase
    // is still in progress so the table settings surface advances to complete/error on its own.
    refetchInterval: (query) => {
      const status = query.state.data?.setup_status
      return status && WAREHOUSE_SETUP_IN_PROGRESS_STATUSES.includes(status) ? 5000 : false
    },
    ...options,
  })

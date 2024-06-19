import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { analyticsKeys } from './keys'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'

export type WarehouseBackendsVariables = {
  projectRef: string
}

export async function getWarehouseBackends(
  { projectRef }: WarehouseBackendsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  // [Jordi] Commented out since its not needed for now and it will throw an error

  // const response = await get(`/platform/projects/{ref}/analytics/warehouse/backends`, {
  //   params: { path: { ref: projectRef } },
  //   signal,
  // })

  // if (response.error) {
  //   throw response.error
  // }

  // return response
}

export type WarehouseBackendsData = Awaited<ReturnType<typeof getWarehouseBackends>>
export type WarehouseBackendsError = ResponseError

export const useWarehouseBackendsQuery = <TData = WarehouseBackendsData>(
  { projectRef }: WarehouseBackendsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WarehouseBackendsData, WarehouseBackendsError, TData> = {}
) =>
  useQuery<WarehouseBackendsData, WarehouseBackendsError, TData>(
    analyticsKeys.warehouseBackends(projectRef),
    ({ signal }) => getWarehouseBackends({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'lib/common/fetch'
import { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type EdgeFunctionServiceStatusVariables = {
  projectRef?: string
}

export async function getEdgeFunctionServiceStatus(signal?: AbortSignal) {
  const res = await get(`https://obuldanrptloktxcffvn.supabase.co/functions/v1/health-check`, {
    signal,
  })
  return res as { healthy: boolean }
}

export type EdgeFunctionServiceStatusData = Awaited<ReturnType<typeof getEdgeFunctionServiceStatus>>
export type EdgeFunctionServiceStatusError = ResponseError

export const useEdgeFunctionServiceStatusQuery = <TData = EdgeFunctionServiceStatusData>(
  { projectRef }: EdgeFunctionServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EdgeFunctionServiceStatusData, EdgeFunctionServiceStatusError, TData> = {}
) =>
  useQuery<EdgeFunctionServiceStatusData, EdgeFunctionServiceStatusError, TData>(
    serviceStatusKeys.edgeFunctions(projectRef),
    ({ signal }) => getEdgeFunctionServiceStatus(signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type EdgeFunctionServiceStatusVariables = {
  projectRef?: string
}

export async function getEdgeFunctionServiceStatus(signal?: AbortSignal) {
  try {
    const res = await fetch('https://obuldanrptloktxcffvn.supabase.co/functions/v1/health-check', {
      method: 'GET',
      signal,
    })
    const response = await res.json()
    return response as { healthy: boolean }
  } catch (err) {
    return { healthy: false }
  }
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

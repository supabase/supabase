import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

export async function getIntegrations(signal?: AbortSignal) {
  const { data, error } = await get('/platform/integrations', {
    signal,
  })

  if (error) handleError(error)
  return data
}

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type ProjectIntegrationConnectionsData = Awaited<ReturnType<typeof getIntegrations>>
export type IntegrationsError = ResponseError

export const useIntegrationsQuery = <TData = IntegrationsData>({
  enabled = true,
  ...options
}: UseQueryOptions<IntegrationsData, IntegrationsError, TData> = {}) =>
  useQuery<IntegrationsData, IntegrationsError, TData>(
    integrationKeys.integrationsList(),
    ({ signal }) => getIntegrations(signal),
    {
      enabled: enabled,
      staleTime: 30 * 60 * 1000, // 30 minutes
      ...options,
    }
  )

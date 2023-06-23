import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'
import { IntegrationsVariables, Integration } from './integrations.types'

export type IntegrationsResponse = Integration[]

export async function getIntegrations({}: {}, signal?: AbortSignal) {
  const response = await get(`${API_URL}/integrations`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as IntegrationsResponse
}

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type ProjectIntegrationConnectionsData = Awaited<ReturnType<typeof getIntegrations>>
export type IntegrationsError = unknown

export const useIntegrationsQuery = <TData = IntegrationsData>({
  enabled = true,
  ...options
}: UseQueryOptions<IntegrationsData, IntegrationsError, TData> = {}) =>
  useQuery<IntegrationsData, IntegrationsError, TData>(
    integrationKeys.integrationsList(),
    ({ signal }) => getIntegrations({}, signal),
    { enabled: enabled, ...options }
  )

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { Integration, IntegrationsVariables } from './integrations.types'
import { integrationKeys } from './keys'

export type IntegrationsResponse = Integration[]

export async function getIntegrations({ orgSlug }: IntegrationsVariables, signal?: AbortSignal) {
  if (!orgSlug) {
    throw new Error('orgSlug is required')
  }
  const response = await get(`${API_URL}/integrations/${orgSlug}?expand=true`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as IntegrationsResponse
}

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type ProjectIntegrationConnectionsData = Awaited<ReturnType<typeof getIntegrations>>
export type IntegrationsError = ResponseError

export const useOrgIntegrationsQuery = <TData = IntegrationsData>(
  { orgSlug }: IntegrationsVariables,
  { enabled = true, ...options }: UseQueryOptions<IntegrationsData, IntegrationsError, TData> = {}
) =>
  useQuery<IntegrationsData, IntegrationsError, TData>(
    integrationKeys.integrationsListWithOrg(orgSlug),
    ({ signal }) => getIntegrations({ orgSlug }, signal),
    { enabled: enabled && typeof orgSlug !== 'undefined', ...options }
  )

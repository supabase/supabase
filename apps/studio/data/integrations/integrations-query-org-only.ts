import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { Integration } from './integrations.types'
import { integrationKeys } from './keys'

type IntegrationsVariables = {
  orgSlug?: string
}

export async function getIntegrations({ orgSlug }: IntegrationsVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { data, error } = await get('/platform/integrations/{slug}', {
    params: { path: { slug: orgSlug } },
  })
  if (error) handleError(error)
  return data as unknown as Integration[]
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

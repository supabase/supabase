import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationsDirectoryKeys } from './keys'

type IntegrationsDirectoryVariables = {
  orgId?: number
  integrationId?: string
}

export type IntegrationEntry = {
  id: string
  organization_id: number
  slug: string
  overview: string
}

export async function getIntegrationsDirectory(
  { orgId, integrationId }: IntegrationsDirectoryVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get('/platform/integrations-directory', {
    params: { query: { organization_id: orgId } },
    signal,
  } as never)

  if (error) handleError(error)
  return data
}

export type IntegrationsDirectoryData = Awaited<ReturnType<typeof getIntegrationsDirectory>>
export type IntegrationsError = ResponseError

export const useIntegrationsDirectoryQuery = <TData = IntegrationsDirectoryData>(
  vars: IntegrationsDirectoryVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<IntegrationsDirectoryData, IntegrationsError, TData> = {}
) =>
  useQuery<IntegrationsDirectoryData, IntegrationsError, TData>(
    integrationsDirectoryKeys.integrationsDirectoryList(vars.orgId, vars.integrationId),
    ({ signal }) => getIntegrationsDirectory(vars, signal),
    { enabled: enabled, ...options }
  )

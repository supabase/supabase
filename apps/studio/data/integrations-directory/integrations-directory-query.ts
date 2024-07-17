import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationsDirectoryKeys } from './keys'

type IntegrationsDirectoryVariables = {
  orgSlug?: string
  integrationId?: string
}

export type IntegrationEntry = {
  id: number
  parent_id: number | null
  organization_slug: string | null
  approved: boolean
  slug: string
  overview: string
}

export async function getIntegrationsDirectory(
  { orgSlug, integrationId }: IntegrationsDirectoryVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) {
    return
  }

  const { data, error } = await get('/platform/integrations-directory/{slug}', {
    params: { path: { slug: orgSlug } },
    signal,
  } as never)

  if (error) handleError(error)
  // TODO(Ivan): Please fix me
  return data as IntegrationEntry
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
    integrationsDirectoryKeys.integrationsDirectoryList(vars.orgSlug, vars.integrationId),
    ({ signal }) => getIntegrationsDirectory(vars, signal),
    { enabled: enabled, ...options }
  )

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationsDirectoryKeys } from './keys'

type IntegrationsDirectoryVariables = {
  orgSlug: string
}

export type IntegrationEntry = components['schemas']['IntegrationsDirectoryEntryResponse']

export async function getIntegrationsDirectory(
  { orgSlug }: IntegrationsDirectoryVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) {
    return
  }

  const { data, error } = await get('/platform/integrations-directory/{slug}', {
    params: { path: { slug: orgSlug } },
    signal,
  })

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
    integrationsDirectoryKeys.integrationsDirectoryList(vars.orgSlug),
    ({ signal }) => getIntegrationsDirectory(vars, signal),
    { enabled: enabled, ...options }
  )

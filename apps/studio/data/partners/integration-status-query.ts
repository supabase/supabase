import { useQuery } from '@tanstack/react-query'

import { partnersKeys } from './keys'
import type { components } from '@/data/api'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type IntegrationVariables = {
  projectRef?: string
}

export type IntegrationStatus =
  components['schemas']['PartnerIntegrationListResponse']['integrations'][0]

async function getIntegrations({ projectRef }: IntegrationVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/integrations/partners/{ref}`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data.integrations
}

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type IntegrationsError = ResponseError

export const usePartnerIntegrationsQuery = <TData = IntegrationsData>(
  { projectRef }: IntegrationVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<IntegrationsData, IntegrationsError, TData> = {}
) =>
  useQuery<IntegrationsData, IntegrationsError, TData>({
    queryKey: partnersKeys.getIntegrations(projectRef),
    queryFn: ({ signal }) => getIntegrations({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

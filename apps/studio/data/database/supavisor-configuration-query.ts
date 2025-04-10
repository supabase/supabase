import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

type SupavisorConfigurationVariables = {
  projectRef?: string
}

export async function getSupavisorConfiguration(
  { projectRef }: SupavisorConfigurationVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/config/supavisor`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type SupavisorConfigurationData = Awaited<ReturnType<typeof getSupavisorConfiguration>>
export type SupavisorConfigurationError = ResponseError

export const useSupavisorConfigurationQuery = <TData = SupavisorConfigurationData>(
  { projectRef }: SupavisorConfigurationVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<SupavisorConfigurationData, SupavisorConfigurationError, TData> = {}
) =>
  useQuery<SupavisorConfigurationData, SupavisorConfigurationError, TData>(
    databaseKeys.poolingConfiguration(projectRef),
    ({ signal }) => getSupavisorConfiguration({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

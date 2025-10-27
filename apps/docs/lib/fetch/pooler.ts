import { type UseQueryOptions, useQuery } from '@tanstack/react-query'

import type { ResponseError } from '~/types/fetch'
import { get } from './fetchWrappers'

const poolerKeys = {
  supavisorConfig: (projectRef: string | undefined) => ['supavisor', 'config', projectRef] as const,
}

export interface SupavisorConfigVariables {
  projectRef?: string
}

async function getSupavisorConfig({ projectRef }: SupavisorConfigVariables, signal?: AbortSignal) {
  if (!projectRef) throw Error('projectRef is required')

  const { data, error } = await get(`/platform/projects/{ref}/config/supavisor`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) throw error

  return data
}

export type SupavisorConfigData = Awaited<ReturnType<typeof getSupavisorConfig>>
type SupavisorConfigError = ResponseError

export function useSupavisorConfigQuery<TData = SupavisorConfigData>(
  { projectRef }: SupavisorConfigVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<SupavisorConfigData, SupavisorConfigError, TData>, 'queryKey'>
) {
  return useQuery<SupavisorConfigData, SupavisorConfigError, TData>({
    queryKey: poolerKeys.supavisorConfig(projectRef),
    queryFn: ({ signal }) => getSupavisorConfig({ projectRef }, signal),
    enabled,
    ...options,
  })
}

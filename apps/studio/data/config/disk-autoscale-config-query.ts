import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { configKeys } from './keys'

export type DiskAutoscaleCustomConfigVariables = {
  projectRef?: string
}

// export type DiskAttribute = components['schemas']['DiskResponse']

export async function getDiskAutoscaleCustomConfig(
  { projectRef }: DiskAutoscaleCustomConfigVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/disk/custom-config`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DiskAutoscaleCustomConfigData = Awaited<ReturnType<typeof getDiskAutoscaleCustomConfig>>
export type DiskAutoscaleCustomConfigError = ResponseError

export const useDiskAutoscaleCustomConfigQuery = <TData = DiskAutoscaleCustomConfigData>(
  { projectRef }: DiskAutoscaleCustomConfigVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    DiskAutoscaleCustomConfigData,
    DiskAutoscaleCustomConfigError,
    TData
  > = {}
) =>
  useQuery<DiskAutoscaleCustomConfigData, DiskAutoscaleCustomConfigError, TData>({
    queryKey: configKeys.diskAutoscaleConfig(projectRef),
    queryFn: ({ signal }) => getDiskAutoscaleCustomConfig({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

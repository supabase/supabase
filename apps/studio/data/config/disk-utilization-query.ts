import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { configKeys } from './keys'

export type DiskUtilizationVariables = {
  projectRef?: string
}

export async function getDiskUtilization(
  { projectRef }: DiskUtilizationVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/disk/util`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DiskUtilizationData = Awaited<ReturnType<typeof getDiskUtilization>>
export type DiskUtilizationError = ResponseError

export const useDiskUtilizationQuery = <TData = DiskUtilizationData>(
  { projectRef }: DiskUtilizationVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DiskUtilizationData, DiskUtilizationError, TData> = {}
) =>
  useQuery<DiskUtilizationData, DiskUtilizationError, TData>({
    queryKey: configKeys.diskUtilization(projectRef),
    queryFn: ({ signal }) => getDiskUtilization({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

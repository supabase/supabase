import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { projectKeys } from './keys'

export type ProjectLastRestoreInitiatedVariables = { ref?: string }

export async function getProjectLastRestoreInitiated(
  { ref }: ProjectLastRestoreInitiatedVariables,
  signal?: AbortSignal
) {
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}/restore/status', {
    params: { path: { ref } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectLastRestoreInitiatedData = Awaited<
  ReturnType<typeof getProjectLastRestoreInitiated>
>
export type ProjectLastRestoreInitiatedError = ResponseError

export const useProjectLastRestoreInitiatedQuery = <TData = ProjectLastRestoreInitiatedData>(
  { ref }: ProjectLastRestoreInitiatedVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    ProjectLastRestoreInitiatedData,
    ProjectLastRestoreInitiatedError,
    TData
  > = {}
) =>
  useQuery<ProjectLastRestoreInitiatedData, ProjectLastRestoreInitiatedError, TData>({
    queryKey: projectKeys.lastRestoreInitiated(ref),
    queryFn: ({ signal }) => getProjectLastRestoreInitiated({ ref }, signal),
    enabled: enabled && typeof ref !== 'undefined',
    ...options,
  })

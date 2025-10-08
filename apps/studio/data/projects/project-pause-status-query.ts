import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectPauseStatusVariables = { ref?: string }

export async function getProjectPausedStatus(
  { ref }: ProjectPauseStatusVariables,
  signal?: AbortSignal
) {
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}/pause/status', {
    params: { path: { ref } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectPauseStatusData = Awaited<ReturnType<typeof getProjectPausedStatus>>
export type ProjectPauseStatusError = ResponseError

export const useProjectPauseStatusQuery = <TData = ProjectPauseStatusData>(
  { ref }: ProjectPauseStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectPauseStatusData, ProjectPauseStatusError, TData> = {}
) =>
  useQuery<ProjectPauseStatusData, ProjectPauseStatusError, TData>(
    projectKeys.pauseStatus(ref),
    ({ signal }) => getProjectPausedStatus({ ref }, signal),
    {
      enabled: enabled && typeof ref !== 'undefined',
      ...options,
    }
  )

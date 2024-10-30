import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectStatusVariables = {
  projectRef?: string
}

export async function getProjectStatus(
  { projectRef }: ProjectStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/status`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data as { status: string }
}

export type ProjectStatusData = Awaited<ReturnType<typeof getProjectStatus>>
export type ProjectStatusError = ResponseError

export const useProjectStatusQuery = <TData = ProjectStatusData>(
  { projectRef }: ProjectStatusVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectStatusData, ProjectStatusError, TData> = {}
) =>
  useQuery<ProjectStatusData, ProjectStatusError, TData>(
    projectKeys.status(projectRef),
    ({ signal }) => getProjectStatus({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

import { useQuery } from '@tanstack/react-query'

import { projectKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ProjectMembersVariables = {
  projectRef?: string
}

export async function getProjectMembers(
  { projectRef }: ProjectMembersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/members`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data.members
}

export type ProjectMembersData = Awaited<ReturnType<typeof getProjectMembers>>
export type ProjectMembersError = ResponseError

export const useProjectMembersQuery = <TData = ProjectMembersData>(
  { projectRef }: ProjectMembersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectMembersData, ProjectMembersError, TData> = {}
) =>
  useQuery<ProjectMembersData, ProjectMembersError, TData>({
    queryKey: projectKeys.projectMembers(projectRef),
    queryFn: ({ signal }) => getProjectMembers({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

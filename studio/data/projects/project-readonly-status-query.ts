import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { useCallback } from 'react'
import { projectKeys } from './keys'

export type ProjectReadOnlyStatusVariables = { projectRef?: string }
export type ProjectReadOnlyStatus = {
  enabled: boolean
  override_enabled: boolean
  override_active_until: string
}

export async function getProjectReadOnlyStatus(
  { projectRef }: ProjectReadOnlyStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  const data = await get(`${API_ADMIN_URL}/projects/${projectRef}/readonly`, { signal })
  if (data.error) throw data.error
  return data as ProjectReadOnlyStatus
}

export type ProjectReadOnlyStatusData = Awaited<ReturnType<typeof getProjectReadOnlyStatus>>
export type ProjectReadOnlyStatusError = unknown

export const useProjectReadOnlyStatusQuery = <TData = ProjectReadOnlyStatusData>(
  { projectRef }: ProjectReadOnlyStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectReadOnlyStatusData, ProjectReadOnlyStatusError, TData> = {}
) =>
  useQuery<ProjectReadOnlyStatusData, ProjectReadOnlyStatusError, TData>(
    projectKeys.readonlyStatus(projectRef),
    ({ signal }) => getProjectReadOnlyStatus({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useProjectReadOnlyStatusPrefetch = ({
  projectRef,
}: ProjectReadOnlyStatusVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(projectKeys.readonlyStatus(projectRef), ({ signal }) =>
        getProjectReadOnlyStatus({ projectRef }, signal)
      )
    }
  }, [projectRef])
}

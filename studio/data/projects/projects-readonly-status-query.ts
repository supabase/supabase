import { QueryClient, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Project, ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectsReadonlyStatusesVariables = {
  ref?: string
}

export async function getProjectsReadonlyStatuses(signal?: AbortSignal) {
  const data = await get(`${API_URL}/projects?include_readonly_mode_status=true`, { signal })
  if (data.error) throw data.error

  return Object.fromEntries(
    data.map((project: any) => [project.ref, project.is_readonly_mode_enabled])
  ) as {
    [k: string]: boolean
  }
}

export type ProjectsReadonlyStatusesData = Awaited<ReturnType<typeof getProjectsReadonlyStatuses>>
export type ProjectsReadonlyStatusesError = ResponseError

export const useProjectsReadonlyStatusesQuery = <TData = ProjectsReadonlyStatusesData>({
  enabled = true,
  ...options
}: UseQueryOptions<ProjectsReadonlyStatusesData, ProjectsReadonlyStatusesError, TData> = {}) =>
  useQuery<ProjectsReadonlyStatusesData, ProjectsReadonlyStatusesError, TData>(
    projectKeys.readonlyStatusList(),
    ({ signal }) => getProjectsReadonlyStatuses(signal),
    { enabled: enabled, ...options }
  )

export function prefetchProjectsReadonlyStatuses(client: QueryClient) {
  return client.prefetchQuery(projectKeys.readonlyStatusList(), ({ signal }) =>
    getProjectsReadonlyStatuses(signal)
  )
}

export function useProjectsReadonlyStatusesPrefetch() {
  const client = useQueryClient()

  return useCallback(() => {
    prefetchProjectsReadonlyStatuses(client)
  }, [client])
}

export function useAutoProjectsReadonlyStatusesPrefetch() {
  const prefetch = useProjectsReadonlyStatusesPrefetch()

  const called = useRef<boolean>(false)
  if (called.current === false) {
    called.current = true
    prefetch()
  }
}

export function invalidateProjectsReadonlyStatusesQuery(client: QueryClient) {
  return client.invalidateQueries(projectKeys.readonlyStatusList())
}

export function setProjectStatus(
  client: QueryClient,
  projectRef: Project['ref'],
  status: Project['status']
) {
  client.setQueriesData<Project[] | undefined>(
    projectKeys.readonlyStatusList(),
    (old) => {
      if (!old) return old

      return old.map((project) => {
        if (project.ref === projectRef) {
          return { ...project, status }
        }
        return project
      })
    },
    { updatedAt: Date.now() }
  )

  client.setQueriesData<Project>(
    projectKeys.detail(projectRef),
    (old) => {
      if (!old) return old

      return { ...old, status }
    },
    { updatedAt: Date.now() }
  )
}

export function setProjectPostgrestStatus(
  client: QueryClient,
  projectRef: Project['ref'],
  status: Project['postgrestStatus']
) {
  client.setQueriesData<Project>(
    projectKeys.detail(projectRef),
    (old) => {
      if (!old) return old

      return { ...old, postgrestStatus: status }
    },
    { updatedAt: Date.now() }
  )
}

import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { createQuery } from 'react-query-kit'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { useProjectDetailQuery, type Project } from './project-detail-query'

export type ProjectsVariables = {
  ref?: string
}

export type ProjectInfo = components['schemas']['ProjectInfo'] & {
  status: components['schemas']['ResourceWithServicesStatusResponse']['status']
}

export async function getProjects(_: void, { signal }: { signal: AbortSignal }) {
  const { data, error } = await get('/platform/projects', { signal })

  if (error) handleError(error)
  return data as ProjectInfo[]
}

export type ProjectsData = Awaited<ReturnType<typeof getProjects>>
export type ProjectsError = ResponseError

export const useProjectsQuery = createQuery<ProjectsData, void, ProjectsError>({
  queryKey: ['projects'],
  fetcher: getProjects,
})

// export const useProjectsQuery2 = <TData = ProjectsData>({
//   enabled = true,
//   ...options
// }: UseQueryOptions<ProjectsData, ProjectsError, TData> = {}) => {
//   const { profile } = useProfile()
//   return useQuery<ProjectsData, ProjectsError, TData>(
//     projectKeys.list(),
//     ({ signal }) => getProjects(signal),
//     { enabled: enabled && profile !== undefined, ...options }
//   )
// }

export function prefetchProjects(client: QueryClient) {
  return client.prefetchQuery(useProjectsQuery.getFetchOptions())
}

export function useProjectsPrefetch() {
  const client = useQueryClient()

  return useCallback(() => {
    prefetchProjects(client)
  }, [client])
}

export function useAutoProjectsPrefetch() {
  const prefetch = useProjectsPrefetch()

  const called = useRef<boolean>(false)
  if (called.current === false) {
    called.current = true
    prefetch()
  }
}

export function invalidateProjectsQuery(client: QueryClient) {
  return client.invalidateQueries({ queryKey: useProjectsQuery.getKey() })
}

export function setProjectStatus(
  client: QueryClient,
  projectRef: Project['ref'],
  status: Project['status']
) {
  client.setQueriesData<Project[] | undefined>(
    { queryKey: useProjectsQuery.getKey() },
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
    { queryKey: useProjectDetailQuery.getKey({ projectRef }) },
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
    { queryKey: useProjectDetailQuery.getKey({ projectRef }) },
    (old) => {
      if (!old) return old

      return { ...old, postgrestStatus: status }
    },
    { updatedAt: Date.now() }
  )
}

import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import type { components } from 'data/api'
import { get, handleError, isValidConnString } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { projectKeys } from './keys'
import { OrgProjectsResponse } from './org-projects-infinite-query'

type ProjectDetailVariables = { ref?: string }
export type ProjectDetail = components['schemas']['ProjectDetailResponse']
export interface Project extends Omit<ProjectDetail, 'status'> {
  /**
   * postgrestStatus is available on client side only.
   * We use this status to check if a project instance is HEALTHY or not
   * If not we will show ConnectingState and run a polling until it's back online
   */
  postgrestStatus?: 'ONLINE' | 'OFFLINE'
  status: ProjectDetail['status']
}

export async function getProjectDetail(
  { ref }: ProjectDetailVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}', {
    params: { path: { ref } },
    signal,
    headers,
  })

  if (error) handleError(error)
  return data as Project
}

export type ProjectDetailData = Awaited<ReturnType<typeof getProjectDetail>>
export type ProjectDetailError = ResponseError

export const useProjectDetailQuery = <TData = ProjectDetailData>(
  { ref }: ProjectDetailVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectDetailData, ProjectDetailError, TData> = {}
) =>
  useQuery<ProjectDetailData, ProjectDetailError, TData>({
    queryKey: projectKeys.detail(ref),
    queryFn: ({ signal }) => getProjectDetail({ ref }, signal),
    enabled: enabled && typeof ref !== 'undefined',
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data
      const status = data && data.status
      const connectionString = data && data.connectionString

      if (status === 'COMING_UP' || status === 'UNKNOWN' || !isValidConnString(connectionString)) {
        return 5 * 1000 // 5 seconds
      }

      return false
    },
    ...options,
  })

export function prefetchProjectDetail(client: QueryClient, { ref }: ProjectDetailVariables) {
  return client.fetchQuery({
    queryKey: projectKeys.detail(ref),
    queryFn: ({ signal }) => getProjectDetail({ ref }, signal),
  })
}

export const useInvalidateProjectDetailsQuery = () => {
  const queryClient = useQueryClient()

  const invalidateProjectDetailsQuery = useCallback(
    (ref: string) => {
      return queryClient.invalidateQueries({ queryKey: projectKeys.detail(ref) })
    },
    [queryClient]
  )

  return { invalidateProjectDetailsQuery }
}

export const useSetProjectPostgrestStatus = () => {
  const queryClient = useQueryClient()

  const setProjectPostgrestStatus = (ref: Project['ref'], status: Project['postgrestStatus']) => {
    return queryClient.setQueriesData<Project>(
      { queryKey: projectKeys.detail(ref) },
      (old) => {
        if (!old) return old
        return { ...old, postgrestStatus: status }
      },
      { updatedAt: Date.now() }
    )
  }

  return { setProjectPostgrestStatus }
}

export const useSetProjectStatus = () => {
  const queryClient = useQueryClient()

  const setProjectStatus = ({
    ref,
    slug,
    status,
  }: {
    ref: Project['ref']
    slug?: string
    status: Project['status']
  }) => {
    // Org projects infinite query
    if (slug) {
      queryClient.setQueriesData<{ pageParams: any; pages: OrgProjectsResponse[] } | undefined>(
        { queryKey: projectKeys.infiniteListByOrg(slug) },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => {
              return {
                ...page,
                projects: page.projects.map((project) =>
                  project.ref === ref ? { ...project, status } : project
                ),
              }
            }),
          }
        },
        { updatedAt: Date.now() }
      )
    }

    // Projects infinite query
    queryClient.setQueriesData<{ pageParams: any; pages: OrgProjectsResponse[] } | undefined>(
      { queryKey: projectKeys.infiniteList() },
      (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => {
            return {
              ...page,
              projects: page.projects.map((project) =>
                project.ref === ref ? { ...project, status } : project
              ),
            }
          }),
        }
      },
      { updatedAt: Date.now() }
    )

    // Project details query
    queryClient.setQueriesData<Project>(
      { queryKey: projectKeys.detail(ref) },
      (old) => {
        if (!old) return old
        return { ...old, status }
      },
      { updatedAt: Date.now() }
    )
  }

  return { setProjectStatus }
}

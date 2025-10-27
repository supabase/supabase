import { QueryClient, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError, isValidConnString } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'
import { OrgProjectsResponse } from './org-projects-infinite-query'

type ProjectDetailVariables = { ref?: string }
type PaginatedProjectsResponse = components['schemas']['ListProjectsPaginatedResponse']

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
  { enabled = true, ...options }: UseQueryOptions<ProjectDetailData, ProjectDetailError, TData> = {}
) =>
  useQuery<ProjectDetailData, ProjectDetailError, TData>(
    projectKeys.detail(ref),
    ({ signal }) => getProjectDetail({ ref }, signal),
    {
      enabled: enabled && typeof ref !== 'undefined',
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval(data) {
        const result = data && (data as unknown as ProjectDetailData)
        const status = result && result.status
        const connectionString = result && result.connectionString

        if (
          status === 'COMING_UP' ||
          status === 'UNKNOWN' ||
          !isValidConnString(connectionString)
        ) {
          return 5 * 1000 // 5 seconds
        }

        return false
      },
      ...options,
    }
  )

export function prefetchProjectDetail(client: QueryClient, { ref }: ProjectDetailVariables) {
  return client.fetchQuery(projectKeys.detail(ref), ({ signal }) =>
    getProjectDetail({ ref }, signal)
  )
}

export const useInvalidateProjectDetailsQuery = () => {
  const queryClient = useQueryClient()

  const invalidateProjectDetailsQuery = (ref: string) => {
    return queryClient.invalidateQueries(projectKeys.detail(ref))
  }

  return { invalidateProjectDetailsQuery }
}

export const useSetProjectPostgrestStatus = () => {
  const queryClient = useQueryClient()

  const setProjectPostgrestStatus = (ref: Project['ref'], status: Project['postgrestStatus']) => {
    return queryClient.setQueriesData<Project>(
      projectKeys.detail(ref),
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
        projectKeys.infiniteListByOrg(slug),
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
      projectKeys.infiniteList(),
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
      projectKeys.detail(ref),
      (old) => {
        if (!old) return old
        return { ...old, status }
      },
      { updatedAt: Date.now() }
    )

    // [Joshen] Temporarily for completeness while we still have UIs depending on the old endpoint (Org teams)
    // Can be removed once we completely deprecate projects-query (Old unpaginated endpoint)
    queryClient.setQueriesData<PaginatedProjectsResponse | undefined>(
      projectKeys.list(),
      (old) => {
        if (!old) return old

        return {
          ...old,
          projects: old.projects.map((project) => {
            if (project.ref === ref) {
              return { ...project, status }
            }
            return project
          }),
        }
      },
      { updatedAt: Date.now() }
    )
  }

  return { setProjectStatus }
}

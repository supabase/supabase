import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { replicaKeys } from '../read-replicas/keys'
import { ReadReplicasData } from '../read-replicas/replicas-query'
import { projectKeys } from './keys'
import { OrgProjectsResponse } from './org-projects-infinite-query'
import type { components } from '@/data/api'
import { get, handleError, isValidConnString, post } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ProjectDetailVariables = { ref?: string; skipWake?: boolean }
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
  { ref, skipWake = false }: ProjectDetailVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>,
  queryClient?: QueryClient
) {
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}', {
    params: { path: { ref } },
    signal,
    headers,
  })

  let connectionString = data?.connectionString

  /**
   * A project is marked as active but potentially hibernated and needs to be woken up (typically few seconds only).
   * To prevent odd side effects like pg-meta queries failing or the likes, we wake up the project proactively and wait for it
   * to be back online before returning the project details.
   */
  if (data?.is_hibernating && !skipWake) {
    // In case project was scaled down, explicitly wake it up before continuing to return the project details
    const { error: errorWaking, data: wakeResponse } = await post('/platform/projects/{ref}/wake', {
      params: { path: { ref } },
      signal,
      headers,
    })

    // We will still let the user load the page in case of a wake error, but log it for debugging purposes
    if (errorWaking) {
      console.error('Error waking up the project', { ref, errorWaking })
    }

    // As the instance IP has changed, we need to use the latest encrypted connection string
    if (wakeResponse) {
      connectionString = wakeResponse.connection_string

      // If replicas were previously fetched, they will hold the old connection string that we need to replace
      queryClient?.setQueryData<ReadReplicasData>(replicaKeys.list(ref), (old) => {
        if (!old) return old

        return old.map((db) => {
          if (db.identifier === ref) {
            return {
              ...db,
              connectionString: wakeResponse.connection_string,
              connection_string_read_only: wakeResponse.connection_string_read_only,
            }
          }
          return db
        })
      })
    }
  }

  if (error) handleError(error)
  return { ...data, connectionString: connectionString } as Project
}

export type ProjectDetailData = Awaited<ReturnType<typeof getProjectDetail>>
export type ProjectDetailError = ResponseError

export const useProjectDetailQuery = <TData = ProjectDetailData>(
  { ref }: ProjectDetailVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectDetailData, ProjectDetailError, TData> = {}
) => {
  const queryClient = useQueryClient()

  return useQuery<ProjectDetailData, ProjectDetailError, TData>({
    queryKey: projectKeys.detail(ref),
    queryFn: ({ signal }) => getProjectDetail({ ref }, signal, undefined, queryClient),
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
}

export function prefetchProjectDetail(client: QueryClient, { ref }: ProjectDetailVariables) {
  return client.fetchQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: projectKeys.detail(ref),
    queryFn: ({ client, signal }) =>
      getProjectDetail({ ref, skipWake: true }, signal, undefined, client),
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
      queryClient.setQueriesData<{ pages: OrgProjectsResponse[] } | undefined>(
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
    queryClient.setQueriesData<{ pages: OrgProjectsResponse[] } | undefined>(
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

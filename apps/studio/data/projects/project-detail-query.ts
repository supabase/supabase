import { QueryClient } from '@tanstack/react-query'
import { createQuery } from 'react-query-kit'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ProjectDetailVariables = { projectRef: string }

export type ProjectMinimal = components['schemas']['ProjectInfo']
export type ProjectDetail = components['schemas']['ProjectDetailResponse']

export interface Project extends Omit<ProjectDetail, 'status'> {
  /**
   * postgrestStatus is available on client side only.
   * We use this status to check if a project instance is HEALTHY or not
   * If not we will show ConnectingState and run a polling until it's back online
   */
  postgrestStatus?: 'ONLINE' | 'OFFLINE'
  status: components['schemas']['ResourceWithServicesStatusResponse']['status']
}

export async function getProjectDetail(
  { projectRef }: ProjectDetailVariables,
  { signal }: { signal: AbortSignal }
) {
  const { data, error } = await get('/platform/projects/{ref}', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as Project
}

export type ProjectDetailData = Awaited<ReturnType<typeof getProjectDetail>>
export type ProjectDetailError = ResponseError

export const useProjectDetailQuery = createQuery<
  ProjectDetailData,
  ProjectDetailVariables,
  ProjectDetailError
>({
  queryKey: ['project', 'detail'],
  fetcher: getProjectDetail,
  staleTime: 30 * 1000, // 30 seconds
  refetchInterval(data) {
    const status = data && (data as unknown as ProjectDetailData).status

    if (status === 'COMING_UP' || status === 'UNKNOWN') {
      return 5 * 1000 // 5 seconds
    }

    return false
  },
})

export function invalidateProjectDetailsQuery(client: QueryClient, projectRef: string) {
  return client.invalidateQueries({ queryKey: useProjectDetailQuery.getKey({ projectRef }) })
}

export function prefetchProjectDetail(client: QueryClient, { projectRef }: ProjectDetailVariables) {
  return client.fetchQuery(useProjectDetailQuery.getFetchOptions({ projectRef }))
}

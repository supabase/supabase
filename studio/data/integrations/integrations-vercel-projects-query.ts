import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { integrationKeys } from './keys'

export type VercelProjectsVariables = {
  orgId?: number
  orgSlug?: string
}

export type VercelProjectsResponse = {
  id: string
  name: string
  metadata: {
    id: string
    name: string
    framework: string
    link: string
  }
}

export async function getVercelProjects({ orgId }: VercelProjectsVariables, signal?: AbortSignal) {
  if (!orgId) {
    throw new Error('orgId is required')
  }

  const response = await get(`${API_URL}/integrations/vercel/projects/${orgId}`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as VercelProjectsResponse[]
}

export type VercelProjectsData = Awaited<ReturnType<typeof getVercelProjects>>
export type VercelProjectsError = unknown

export const useVercelProjectsQuery = <TData = VercelProjectsData>(
  { orgSlug, orgId }: VercelProjectsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<VercelProjectsData, VercelProjectsError, TData> = {}
) =>
  useQuery<VercelProjectsData, VercelProjectsError, TData>(
    integrationKeys.vercelProjectList(orgSlug),
    ({ signal }) => getVercelProjects({ orgSlug, orgId }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined' && typeof orgId !== 'undefined',
      ...options,
    }
  )

/**
 * useVercelProjectsPrefetch is used for prefetching data. For example, starting a query loading before a page is navigated to.
 *
 * @example
 * const prefetch = useVercelProjectsPrefetch({ orgSlug })
 *
 * return (
 *   <Link onMouseEnter={() => prefetch()}>
 *     Start loading on hover
 *   </Link>
 * )
 */
export const useVercelProjectsPrefetch = ({ orgSlug, orgId }: VercelProjectsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (orgSlug) {
      client.prefetchQuery(integrationKeys.vercelProjectList(orgSlug), ({ signal }) =>
        getVercelProjects({ orgSlug, orgId }, signal)
      )
    }
  }, [orgSlug])
}

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { integrationKeys } from './keys'
import { VercelFramework } from './integrations.types'

export type VercelProjectsVariables = {
  organization_integration_id: string | undefined
}

export type VercelProjectsResponse = {
  id: string
  name: string
  framework: VercelFramework
  metadata: {
    id: string
    name: string
    framework: string
    link: string
  }
}

export async function getVercelProjects(
  { organization_integration_id }: VercelProjectsVariables,
  signal?: AbortSignal
) {
  if (!organization_integration_id) {
    throw new Error('organization_integration_id is required')
  }

  const response = await get(
    `${API_URL}/integrations/vercel/projects/${organization_integration_id}`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response as VercelProjectsResponse[]
}

export type VercelProjectsData = Awaited<ReturnType<typeof getVercelProjects>>
export type VercelProjectsError = unknown

export const useVercelProjectsQuery = <TData = VercelProjectsData>(
  { organization_integration_id }: VercelProjectsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<VercelProjectsData, VercelProjectsError, TData> = {}
) =>
  useQuery<VercelProjectsData, VercelProjectsError, TData>(
    integrationKeys.vercelProjectList(organization_integration_id),
    ({ signal }) => getVercelProjects({ organization_integration_id }, signal),
    {
      enabled: enabled && typeof organization_integration_id !== 'undefined',
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
export const useVercelProjectsPrefetch = ({
  // orgSlug,
  // orgId,
  organization_integration_id,
}: VercelProjectsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (organization_integration_id) {
      client.prefetchQuery(
        integrationKeys.vercelProjectList(organization_integration_id),
        ({ signal }) => getVercelProjects({ organization_integration_id }, signal)
      )
    }
  }, [organization_integration_id])
}

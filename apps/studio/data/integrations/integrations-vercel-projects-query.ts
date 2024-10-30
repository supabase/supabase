import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { integrationKeys } from './keys'

export type VercelProjectsVariables = {
  organization_integration_id: string | undefined
}

export async function getVercelProjects(
  { organization_integration_id }: VercelProjectsVariables,
  signal?: AbortSignal
) {
  if (!organization_integration_id) {
    throw new Error('organization_integration_id is required')
  }

  const { data, error } = await get(
    '/platform/integrations/vercel/projects/{organization_integration_id}',
    {
      params: {
        path: { organization_integration_id },
        query: {
          // [Alaister]: setting a large limit here to avoid pagination
          // until we have merged the new shadcn listbox which will support it
          limit: '1000',
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data.projects
}

export type VercelProjectsData = Awaited<ReturnType<typeof getVercelProjects>>
export type VercelProjectsResponse = VercelProjectsData[0]
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

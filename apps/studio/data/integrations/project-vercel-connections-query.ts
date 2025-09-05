import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'
import type { components } from 'data/api'

type GetProjectVercelConnectionsResponse =
  components['schemas']['GetProjectVercelConnectionsResponse']

type ProjectVercelConnectionsVariables = {
  projectRef?: string
}

export async function getProjectVercelConnections(
  { projectRef }: ProjectVercelConnectionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(
    '/platform/integrations/vercel/connections/project/{project_ref}',
    {
      params: { path: { project_ref: projectRef } },
      signal,
    }
  )

  if (error) handleError(error)
  return data as GetProjectVercelConnectionsResponse
}

export type ProjectVercelConnectionsData = Awaited<ReturnType<typeof getProjectVercelConnections>>
export type ProjectVercelConnectionsError = ResponseError

export const useProjectVercelConnectionsQuery = <TData = ProjectVercelConnectionsData>(
  { projectRef }: ProjectVercelConnectionsVariables,
  {
    ...options
  }: UseQueryOptions<ProjectVercelConnectionsData, ProjectVercelConnectionsError, TData> = {}
) =>
  useQuery<ProjectVercelConnectionsData, ProjectVercelConnectionsError, TData>(
    integrationKeys.projectVercelConnections(projectRef),
    ({ signal }) => getProjectVercelConnections({ projectRef }, signal),
    {
      enabled: typeof projectRef !== 'undefined',
      ...options,
    }
  )

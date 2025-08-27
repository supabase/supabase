import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'
import type { EdgeFunctionDeployment } from 'components/interfaces/Functions/EdgeFunctionVersions/types'

export type EdgeFunctionDeploymentsVariables = {
  projectRef?: string
  slug?: string
}

export async function getEdgeFunctionDeployments(
  { projectRef, slug }: EdgeFunctionDeploymentsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')

  const response = await fetch(`/api/edge-functions/deployments?slug=${slug}`, {
    method: 'GET',
    signal,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch deployments: ${response.statusText}`)
  }

  const data = await response.json()
  return data as EdgeFunctionDeployment[]
}

export type EdgeFunctionDeploymentsData = EdgeFunctionDeployment[]
export type EdgeFunctionDeploymentsError = ResponseError

export const useEdgeFunctionDeploymentsQuery = <TData = EdgeFunctionDeploymentsData>(
  { projectRef, slug }: EdgeFunctionDeploymentsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EdgeFunctionDeploymentsData, EdgeFunctionDeploymentsError, TData> = {}
) =>
  useQuery<EdgeFunctionDeploymentsData, EdgeFunctionDeploymentsError, TData>(
    edgeFunctionsKeys.deployments(projectRef, slug),
    ({ signal }) => getEdgeFunctionDeployments({ projectRef, slug }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof slug !== 'undefined',
      ...options,
    }
  )

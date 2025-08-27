import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'
import type { CodeResponse } from 'components/interfaces/Functions/EdgeFunctionVersions/types'

export type EdgeFunctionDeploymentCodeVariables = {
  projectRef?: string
  slug?: string
  version?: number
}

export async function getEdgeFunctionDeploymentCode(
  { projectRef, slug, version }: EdgeFunctionDeploymentCodeVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')
  if (typeof version !== 'number') throw new Error('version is required')

  const response = await fetch(`/api/edge-functions/code?version=${version}`, {
    method: 'GET',
    signal,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch deployment code: ${response.statusText}`)
  }

  const data = await response.json()
  return data as CodeResponse
}

export type EdgeFunctionDeploymentCodeData = CodeResponse
export type EdgeFunctionDeploymentCodeError = ResponseError

export const useEdgeFunctionDeploymentCodeQuery = <TData = EdgeFunctionDeploymentCodeData>(
  { projectRef, slug, version }: EdgeFunctionDeploymentCodeVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EdgeFunctionDeploymentCodeData, EdgeFunctionDeploymentCodeError, TData> = {}
) =>
  useQuery<EdgeFunctionDeploymentCodeData, EdgeFunctionDeploymentCodeError, TData>(
    edgeFunctionsKeys.deploymentCode(projectRef, slug, version!),
    ({ signal }) => getEdgeFunctionDeploymentCode({ projectRef, slug, version }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof slug !== 'undefined' &&
        typeof version === 'number',
      ...options,
    }
  )

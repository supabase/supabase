import { useQuery } from '@tanstack/react-query'

import { configKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DeploymentModeResponse = {
  is_cli_mode: boolean
}

export async function getDeploymentMode(signal?: AbortSignal): Promise<DeploymentModeResponse> {
  const response = await fetch(`${API_URL}/platform/deployment-mode`, { signal })
  const body = await response.json()

  if (!response.ok) {
    handleError(body)
  }

  return body
}

export type DeploymentModeData = Awaited<ReturnType<typeof getDeploymentMode>>
export type DeploymentModeError = ResponseError

export const useDeploymentModeQuery = <TData = DeploymentModeData>(
  options: UseCustomQueryOptions<DeploymentModeData, DeploymentModeError, TData> = {}
) => {
  const { enabled = true, ...rest } = options

  return useQuery<DeploymentModeData, DeploymentModeError, TData>({
    queryKey: configKeys.deploymentMode(),
    queryFn: ({ signal }) => getDeploymentMode(signal),
    // Only fetch in non-platform mode (CLI or self-hosted)
    enabled: enabled && !IS_PLATFORM,
    // Deployment mode is fixed for a session
    staleTime: Infinity,
    ...rest,
  })
}

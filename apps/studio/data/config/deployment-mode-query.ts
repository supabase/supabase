import { useQuery } from '@tanstack/react-query'

import { handleError } from 'data/fetchers'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'

export type DeploymentMode = {
  is_cli_mode: boolean
}

export async function getDeploymentMode(signal?: AbortSignal): Promise<DeploymentMode> {
  const response = await fetch(`${API_URL}/platform/deployment-mode`, { signal })

  if (!response.ok) {
    handleError(await response.json())
  }

  return response.json()
}

export type DeploymentModeData = Awaited<ReturnType<typeof getDeploymentMode>>
export type DeploymentModeError = ResponseError

export const useDeploymentModeQuery = <TData = DeploymentModeData>(
  options: UseCustomQueryOptions<DeploymentModeData, DeploymentModeError, TData> = {}
) => {
  const { enabled = true, ...rest } = options

  return useQuery<DeploymentModeData, DeploymentModeError, TData>({
    queryKey: ['deployment-mode'],
    queryFn: ({ signal }) => getDeploymentMode(signal),
    // Only fetch in non-platform mode (CLI or self-hosted)
    enabled: enabled && !IS_PLATFORM,
    // Cache for the entire session - deployment mode doesn't change
    staleTime: Infinity,
    ...rest,
  })
}

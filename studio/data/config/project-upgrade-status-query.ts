import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import {
  DatabaseUpgradeError,
  DatabaseUpgradeStatus,
  DatabaseUpgradeProgress,
} from '@supabase/shared-types/out/events'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { useCallback } from 'react'
import { configKeys } from './keys'

export type ProjectUpgradingStatusVariables = {
  projectRef?: string
}

export type ProjectUpgradingStatusResponse = {
  databaseUpgradeStatus: {
    error?: DatabaseUpgradeError
    progress?: DatabaseUpgradeProgress
    status: DatabaseUpgradeStatus
    initiated_at: string
    target_version: number
  } | null
}

export async function getProjectUpgradingStatus(
  { projectRef }: ProjectUpgradingStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await get(`${API_ADMIN_URL}/projects/${projectRef}/upgrade/status`, { signal })
  if (response.error) throw response.error

  return response as ProjectUpgradingStatusResponse
}

export type ProjectUpgradingStatusData = Awaited<ReturnType<typeof getProjectUpgradingStatus>>
export type ProjectUpgradingStatusError = unknown

export const useProjectUpgradingStatusQuery = <TData = ProjectUpgradingStatusData>(
  { projectRef }: ProjectUpgradingStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectUpgradingStatusData, ProjectUpgradingStatusError, TData> = {}
) => {
  return useQuery<ProjectUpgradingStatusData, ProjectUpgradingStatusError, TData>(
    configKeys.upgradeStatus(projectRef),
    ({ signal }) => getProjectUpgradingStatus({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      refetchInterval(data) {
        const response = data as unknown as ProjectUpgradingStatusResponse
        if (!response || response.databaseUpgradeStatus === null) return false

        const interval =
          response.databaseUpgradeStatus.status === DatabaseUpgradeStatus.Upgrading ? 5000 : false
        return interval
      },
      ...options,
    }
  )
}

export const useProjectUpgradingStatusPrefetch = ({
  projectRef,
}: ProjectUpgradingStatusVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(configKeys.upgradeStatus(projectRef), ({ signal }) =>
        getProjectUpgradingStatus({ projectRef }, signal)
      )
    }
  }, [projectRef])
}

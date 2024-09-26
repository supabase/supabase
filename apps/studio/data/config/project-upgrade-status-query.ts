import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import {
  DatabaseUpgradeError,
  DatabaseUpgradeStatus,
  DatabaseUpgradeProgress,
} from '@supabase/shared-types/out/events'
import { PROJECT_STATUS } from 'lib/constants'
import { configKeys } from './keys'
import { get, handleError } from 'data/fetchers'

export type ProjectUpgradingStatusVariables = {
  projectRef?: string
  projectStatus?: string
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

  const { data, error } = await get(`/v1/projects/{ref}/upgrade/status`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)

  return data as ProjectUpgradingStatusResponse
}

export type ProjectUpgradingStatusData = Awaited<ReturnType<typeof getProjectUpgradingStatus>>
export type ProjectUpgradingStatusError = unknown

export const useProjectUpgradingStatusQuery = <TData = ProjectUpgradingStatusData>(
  { projectRef, projectStatus }: ProjectUpgradingStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectUpgradingStatusData, ProjectUpgradingStatusError, TData> = {}
) => {
  const client = useQueryClient()

  return useQuery<ProjectUpgradingStatusData, ProjectUpgradingStatusError, TData>(
    configKeys.upgradeStatus(projectRef),
    ({ signal }) => getProjectUpgradingStatus({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      refetchInterval(data) {
        const response = data as unknown as ProjectUpgradingStatusResponse
        if (!response) return false

        const interval =
          // Transited to UPGRADING state via client, but job not yet picked up
          (projectStatus === PROJECT_STATUS.UPGRADING &&
            response.databaseUpgradeStatus?.status !== DatabaseUpgradeStatus.Upgrading) ||
          // Project currently getting upgraded
          response.databaseUpgradeStatus?.status === DatabaseUpgradeStatus.Upgrading
            ? 5000
            : false

        return interval
      },
      onSuccess(data) {
        const response = data as unknown as ProjectUpgradingStatusResponse
        if (response.databaseUpgradeStatus?.status === DatabaseUpgradeStatus.Upgraded) {
          client.invalidateQueries(configKeys.upgradeEligibility(projectRef))
        }
      },
      ...options,
    }
  )
}

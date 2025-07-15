import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { PROJECT_STATUS } from 'lib/constants'
import { configKeys } from './keys'

export type ProjectUpgradingStatusVariables = {
  projectRef?: string
  projectStatus?: string
  trackingId?: string | null
}

export async function getProjectUpgradingStatus(
  { projectRef, trackingId }: ProjectUpgradingStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const queryParams: Record<string, string> = {}
  if (trackingId) {
    queryParams['tracking_id'] = trackingId
  }

  const { data, error } = await get(`/v1/projects/{ref}/upgrade/status`, {
    params: { path: { ref: projectRef }, query: queryParams },
    signal,
  })
  if (error) handleError(error)

  return data
}

export type ProjectUpgradingStatusData = Awaited<ReturnType<typeof getProjectUpgradingStatus>>
export type ProjectUpgradingStatusError = unknown

export const useProjectUpgradingStatusQuery = <TData = ProjectUpgradingStatusData>(
  { projectRef, projectStatus, trackingId }: ProjectUpgradingStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectUpgradingStatusData, ProjectUpgradingStatusError, TData> = {}
) => {
  const client = useQueryClient()

  return useQuery<ProjectUpgradingStatusData, ProjectUpgradingStatusError, TData>(
    configKeys.upgradeStatus(projectRef),
    ({ signal }) => getProjectUpgradingStatus({ projectRef, trackingId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      refetchInterval(data) {
        const response = data as unknown as ProjectUpgradingStatusData
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
        const response = data as unknown as ProjectUpgradingStatusData
        if (response.databaseUpgradeStatus?.status === DatabaseUpgradeStatus.Upgraded) {
          client.invalidateQueries(configKeys.upgradeEligibility(projectRef))
        }
      },
      ...options,
    }
  )
}

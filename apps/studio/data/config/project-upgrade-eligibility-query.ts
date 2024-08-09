import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import { get, handleError } from 'data/fetchers'
import { useProjectByRef } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants/infrastructure'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectUpgradeEligibilityVariables = { projectRef?: string }
export type ProjectUpgradeEligibilityResponse = {
  eligible: boolean
  current_app_version: string
  latest_app_version: string
  target_upgrade_versions: { postgres_version: number; app_version: string }[]
  requires_manual_intervention: string | null
  potential_breaking_changes: string[]
  duration_estimate_hours: number
  legacy_auth_custom_roles: string[]
  extension_dependent_objects: string[]
}

export async function getProjectUpgradeEligibility(
  { projectRef }: ProjectUpgradeEligibilityVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/v1/projects/{ref}/upgrade/eligibility', {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data as ProjectUpgradeEligibilityResponse
}

export type ProjectUpgradeEligibilityData = Awaited<ReturnType<typeof getProjectUpgradeEligibility>>
export type ProjectUpgradeEligibilityError = ResponseError

export const useProjectUpgradeEligibilityQuery = <TData = ProjectUpgradeEligibilityData>(
  { projectRef }: ProjectUpgradeEligibilityVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectUpgradeEligibilityData, ProjectUpgradeEligibilityError, TData> = {}
) => {
  const project = useProjectByRef(projectRef)
  return useQuery<ProjectUpgradeEligibilityData, ProjectUpgradeEligibilityError, TData>(
    configKeys.upgradeEligibility(projectRef),
    ({ signal }) => getProjectUpgradeEligibility({ projectRef }, signal),
    {
      enabled:
        enabled &&
        project !== undefined &&
        project.status === PROJECT_STATUS.ACTIVE_HEALTHY &&
        typeof projectRef !== 'undefined' &&
        IS_PLATFORM,
      ...options,
    }
  )
}

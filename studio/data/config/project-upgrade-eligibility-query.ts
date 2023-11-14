import { useCallback } from 'react'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { configKeys } from './keys'
import { ResponseError } from 'types'

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

  const response = await get(`${API_ADMIN_URL}/projects/${projectRef}/upgrade/eligibility`, {
    signal,
  })
  if (response.error) throw response.error
  return response as ProjectUpgradeEligibilityResponse
}

export type ProjectUpgradeEligibilityData = Awaited<ReturnType<typeof getProjectUpgradeEligibility>>
export type ProjectUpgradeEligibilityError = ResponseError

export const useProjectUpgradeEligibilityQuery = <TData = ProjectUpgradeEligibilityData>(
  { projectRef }: ProjectUpgradeEligibilityVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectUpgradeEligibilityData, ProjectUpgradeEligibilityError, TData> = {}
) =>
  useQuery<ProjectUpgradeEligibilityData, ProjectUpgradeEligibilityError, TData>(
    configKeys.upgradeEligibility(projectRef),
    ({ signal }) => getProjectUpgradeEligibility({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useProjectUpgradeEligibilityPrefetch = ({
  projectRef,
}: ProjectUpgradeEligibilityVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(configKeys.upgradeEligibility(projectRef), ({ signal }) =>
        getProjectUpgradeEligibility({ projectRef }, signal)
      )
    }
  }, [projectRef])
}

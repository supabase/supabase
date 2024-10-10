import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import { get, handleError } from 'data/fetchers'
import { useProjectByRef } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants/infrastructure'
import type { ResponseError } from 'types'
import { configKeys } from './keys'
import { components } from 'api-types'

export type ProjectUpgradeTargetVersion = components['schemas']['ProjectVersion']
export type ProjectUpgradeEligibilityVariables = { projectRef?: string }
export type ProjectUpgradeEligibilityResponse =
  components['schemas']['ProjectUpgradeEligibilityResponse']

export async function getProjectUpgradeEligibility(
  { projectRef }: ProjectUpgradeEligibilityVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/v1/projects/{ref}/upgrade/eligibility', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
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

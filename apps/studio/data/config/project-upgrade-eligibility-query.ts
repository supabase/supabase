import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { IS_PLATFORM } from 'common'
import { get, handleError } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { PROJECT_STATUS } from 'lib/constants/infrastructure'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { configKeys } from './keys'

export type ProjectUpgradeTargetVersion = { postgres_version: string; release_channel: string }
export type ProjectUpgradeEligibilityVariables = { projectRef?: string }
export type ProjectUpgradeEligibilityResponse =
  components['schemas']['ProjectUpgradeEligibilityResponse']
export type ProjectUpgradeEligibilityValidationError =
  ProjectUpgradeEligibilityResponse['validation_errors'][number]

/**
 * Fetches upgrade eligibility information for a project.
 *
 * @param projectRef - The project's reference identifier
 * @returns The project upgrade eligibility response, or `undefined` if no data was returned
 * @throws Error if `projectRef` is not provided
 */
export async function getProjectUpgradeEligibility(
  { projectRef }: ProjectUpgradeEligibilityVariables,
  signal?: AbortSignal
): Promise<ProjectUpgradeEligibilityResponse | undefined> {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/v1/projects/{ref}/upgrade/eligibility', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data as ProjectUpgradeEligibilityResponse | undefined
}

export type ProjectUpgradeEligibilityData = Awaited<ReturnType<typeof getProjectUpgradeEligibility>>
export type ProjectUpgradeEligibilityError = ResponseError

export const useProjectUpgradeEligibilityQuery = <TData = ProjectUpgradeEligibilityData>(
  { projectRef }: ProjectUpgradeEligibilityVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    ProjectUpgradeEligibilityData,
    ProjectUpgradeEligibilityError,
    TData
  > = {}
) => {
  const { data: project } = useProjectDetailQuery({ ref: projectRef })
  return useQuery<ProjectUpgradeEligibilityData, ProjectUpgradeEligibilityError, TData>({
    queryKey: configKeys.upgradeEligibility(projectRef),
    queryFn: ({ signal }) => getProjectUpgradeEligibility({ projectRef }, signal),
    enabled:
      enabled &&
      project !== undefined &&
      project.status === PROJECT_STATUS.ACTIVE_HEALTHY &&
      typeof projectRef !== 'undefined' &&
      IS_PLATFORM,
    ...options,
  })
}

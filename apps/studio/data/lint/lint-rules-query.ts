import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { ResponseError } from 'types'
import { lintKeys } from './keys'

type ProjectLintRulesVariables = {
  projectRef?: string
}
type LintDismissalResponse = components['schemas']['ListNotificationExceptionsResponse']
export type LintException = LintDismissalResponse['exceptions'][0]

export async function getProjectLintRules(
  { projectRef }: ProjectLintRulesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}/notifications/advisor/exceptions', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type ProjectLintRulesData = Awaited<ReturnType<typeof getProjectLintRules>>
export type ProjectLintRulesError = ResponseError

export const useProjectLintRulesQuery = <TData = ProjectLintRulesData>(
  { projectRef }: ProjectLintRulesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectLintRulesData, ProjectLintRulesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ProjectLintRulesData, ProjectLintRulesError, TData>(
    lintKeys.lintRules(projectRef),
    ({ signal }) => getProjectLintRules({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
      ...options,
    }
  )
}

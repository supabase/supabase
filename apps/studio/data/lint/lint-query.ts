import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { ResponseError } from 'types'
import { lintKeys } from './keys'

type ProjectLintsVariables = {
  projectRef?: string
}
type ProjectLintResponse = components['schemas']['GetProjectLintsResponseDto']
export type Lint = ProjectLintResponse[0]
export type LINT_TYPES = ProjectLintResponse[0]['name']

export async function getProjectLints({ projectRef }: ProjectLintsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/run-lints`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type ProjectLintsData = Awaited<ReturnType<typeof getProjectLints>>
export type ProjectLintsError = ResponseError

export const useProjectLintsQuery = <TData = ProjectLintsData>(
  { projectRef }: ProjectLintsVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectLintsData, ProjectLintsError, TData> = {}
) => {
  const project = useSelectedProject()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ProjectLintsData, ProjectLintsError, TData>(
    lintKeys.lint(projectRef),
    ({ signal }) => getProjectLints({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
      ...options,
    }
  )
}

import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { lintKeys } from './keys'

export type LINT_TYPES = components['schemas']['ProjectLintResponse']['name']
export type Lint = components['schemas']['ProjectLintResponse']
export type ProjectLintsVariables = {
  projectRef: string
}

const getProjectLints = async (
  { projectRef }: ProjectLintsVariables,
  signal?: AbortSignal
) => {
  const { data, error } = await get('/platform/projects/{ref}/run-lints', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectLintsData = Lint[]
export type ProjectLintsError = unknown

export const useProjectLintsQuery = <TData = ProjectLintsData>(
  { projectRef }: ProjectLintsVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectLintsData, ProjectLintsError, TData> = {}
) =>
  useQuery<ProjectLintsData, ProjectLintsError, TData>(
    lintKeys.lint(projectRef),
    ({ signal }) =>
      getProjectLints({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

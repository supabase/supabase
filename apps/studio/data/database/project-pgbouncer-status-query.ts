import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectPgbouncerStatusVariables = {
  projectRef?: string
}

export async function getProjectPgbouncerStatus(
  { projectRef }: ProjectPgbouncerStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/config/pgbouncer/status', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type ProjectPgbouncerStatusData = Awaited<ReturnType<typeof getProjectPgbouncerStatus>>
export type ProjectPgbouncerStatusError = ResponseError

export const useProjectPgbouncerStatusQuery = <TData = ProjectPgbouncerStatusData>(
  { projectRef }: ProjectPgbouncerStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectPgbouncerStatusData, ProjectPgbouncerStatusError, TData> = {}
) =>
  useQuery<ProjectPgbouncerStatusData, ProjectPgbouncerStatusError, TData>(
    configKeys.pgBouncerStatus(projectRef),
    ({ signal }) => getProjectPgbouncerStatus({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

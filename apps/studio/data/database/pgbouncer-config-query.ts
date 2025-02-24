import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type ProjectPgbouncerConfigVariables = {
  projectRef?: string
}

export async function getProjectPgbouncerConfig(
  { projectRef }: ProjectPgbouncerConfigVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/config/pgbouncer', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type ProjectPgbouncerConfigData = Awaited<ReturnType<typeof getProjectPgbouncerConfig>>
export type ProjectPgbouncerConfigError = ResponseError

export const useProjectPgbouncerConfigQuery = <TData = ProjectPgbouncerConfigData>(
  { projectRef }: ProjectPgbouncerConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectPgbouncerConfigData, ProjectPgbouncerConfigError, TData> = {}
) =>
  useQuery<ProjectPgbouncerConfigData, ProjectPgbouncerConfigError, TData>(
    databaseKeys.pgbouncerConfig(projectRef),
    ({ signal }) => getProjectPgbouncerConfig({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

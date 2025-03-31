import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerConfigVariables = {
  projectRef?: string
}

export async function getPgbouncerConfig(
  { projectRef }: PgbouncerConfigVariables,
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

export type PgbouncerConfigData = Awaited<ReturnType<typeof getPgbouncerConfig>>
export type PgbouncerConfigError = ResponseError

export const usePgbouncerConfigQuery = <TData = PgbouncerConfigData>(
  { projectRef }: PgbouncerConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PgbouncerConfigData, PgbouncerConfigError, TData> = {}
) =>
  useQuery<PgbouncerConfigData, PgbouncerConfigError, TData>(
    databaseKeys.pgbouncerConfig(projectRef),
    ({ signal }) => getPgbouncerConfig({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerStatusVariables = {
  projectRef?: string
}

export async function getPgbouncerStatus(
  { projectRef }: PgbouncerStatusVariables,
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

export type PgbouncerStatusData = Awaited<ReturnType<typeof getPgbouncerStatus>>
export type PgbouncerStatusError = ResponseError

export const usePgbouncerStatusQuery = <TData = PgbouncerStatusData>(
  { projectRef }: PgbouncerStatusVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<PgbouncerStatusData, PgbouncerStatusError, TData> = {}
) =>
  useQuery<PgbouncerStatusData, PgbouncerStatusError, TData>({
    queryKey: databaseKeys.pgbouncerStatus(projectRef),
    queryFn: ({ signal }) => getPgbouncerStatus({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

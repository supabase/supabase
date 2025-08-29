import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerStatusVariables = {
  orgSlug?: string
  projectRef?: string
}

export async function getPgbouncerStatus(
  { orgSlug, projectRef }: PgbouncerStatusVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/config/pgbouncer/status',
    {
      params: {
        path: {
          slug: orgSlug,
          ref: projectRef,
        },
      },
      signal,
    }
  )
  if (error) handleError(error)
  return data
}

export type PgbouncerStatusData = Awaited<ReturnType<typeof getPgbouncerStatus>>
export type PgbouncerStatusError = ResponseError

export const usePgbouncerStatusQuery = <TData = PgbouncerStatusData>(
  { projectRef, orgSlug }: PgbouncerStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PgbouncerStatusData, PgbouncerStatusError, TData> = {}
) =>
  useQuery<PgbouncerStatusData, PgbouncerStatusError, TData>(
    databaseKeys.pgbouncerStatus(projectRef),
    ({ signal }) => getPgbouncerStatus({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

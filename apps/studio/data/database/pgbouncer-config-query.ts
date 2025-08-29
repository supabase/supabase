import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerConfigVariables = {
  orgSlug?: string
  projectRef?: string
}

export async function getPgbouncerConfig(
  { orgSlug, projectRef }: PgbouncerConfigVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/config/pgbouncer',
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

export type PgbouncerConfigData = Awaited<ReturnType<typeof getPgbouncerConfig>>
export type PgbouncerConfigError = ResponseError

export const usePgbouncerConfigQuery = <TData = PgbouncerConfigData>(
  { orgSlug, projectRef }: PgbouncerConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PgbouncerConfigData, PgbouncerConfigError, TData> = {}
) =>
  useQuery<PgbouncerConfigData, PgbouncerConfigError, TData>(
    databaseKeys.pgbouncerConfig(orgSlug, projectRef),
    ({ signal }) => getPgbouncerConfig({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && IS_PLATFORM,
      ...options,
    }
  )

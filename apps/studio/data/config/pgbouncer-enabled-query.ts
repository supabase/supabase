import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

type PgBouncerVariables = {
  projectRef?: string
}

// This API call describes whether PgBouncer is still present on the instance. Eventually PgBouncer will be removed.
export async function getPgBouncerStatus({ projectRef }: PgBouncerVariables, signal?: AbortSignal) {
  if (projectRef === undefined) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/projects/{ref}/config/pgbouncer/status', {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data
}

export type PgBouncerStatusData = Awaited<ReturnType<typeof getPgBouncerStatus>>
export type PgBouncerStatusError = ResponseError

export const usePgBouncerStatus = <TData = PgBouncerStatusData>(
  { projectRef }: PgBouncerVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PgBouncerStatusData, PgBouncerStatusError, TData> = {}
) =>
  useQuery<PgBouncerStatusData, PgBouncerStatusError, TData>(
    configKeys.pgBouncerStatus(projectRef),
    ({ signal }) => getPgBouncerStatus({ projectRef }, signal),
    {
      enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined',
      ...options,
    }
  )

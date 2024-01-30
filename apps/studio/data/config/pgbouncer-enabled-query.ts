import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { configKeys } from './keys'
import { ResponseError } from 'types'
import { get } from 'lib/common/fetch'
import { API_URL, BASE_PATH } from 'lib/constants'

type PgBouncerVariables = {
  projectRef: string
  tld?: string
}

// This API call describes whether PgBouncer is still present on the instance. Eventually PgBouncer will be removed.
export async function getPgBouncerStatus(
  { projectRef, tld }: PgBouncerVariables,
  signal?: AbortSignal
) {
  if (!tld) {
    throw new Error('tld is required')
  }

  const response = await get(`${BASE_PATH}/api/database/${projectRef}/pg-bouncer?tld=${tld}`, {
    signal,
  })

  return !!response
}

export type PgBouncerStatusData = boolean
export type PgBouncerStatusError = ResponseError

export const usePgBouncerStatus = <TData = PgBouncerStatusData>(
  { projectRef, tld }: PgBouncerVariables,
  { enabled, ...options }: UseQueryOptions<PgBouncerStatusData, PgBouncerStatusError, TData> = {}
) =>
  useQuery<PgBouncerStatusData, PgBouncerStatusError, TData>(
    configKeys.pgBouncerStatus(projectRef),
    ({ signal }) => getPgBouncerStatus({ projectRef, tld }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof tld !== 'undefined',
      ...options,
    }
  )

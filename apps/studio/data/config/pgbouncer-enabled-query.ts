import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { configKeys } from './keys'
import { ResponseError } from 'types'
import { get } from 'lib/common/fetch'
import { API_URL, BASE_PATH } from 'lib/constants'

type PgBouncerVariables = {
  projectRef: string
  dbHost: string
}

export async function getPgBouncerStatus(
  { projectRef, dbHost }: PgBouncerVariables,
  signal?: AbortSignal
) {
  if (!dbHost) {
    throw new Error('dbHost is required')
  }

  const response = await get(`${BASE_PATH}/api/database/${projectRef}/pg-bouncer?host=${dbHost}`, {
    signal,
  })

  return !!response
}

export type PgBouncerStatusData = boolean
export type PgBouncerStatusError = ResponseError

export const usePgBouncerStatus = <TData = PgBouncerStatusData>(
  { projectRef, dbHost }: PgBouncerVariables,
  { ...options }: UseQueryOptions<PgBouncerStatusData, PgBouncerStatusError, TData> = {}
) =>
  useQuery<PgBouncerStatusData, PgBouncerStatusError, TData>(
    configKeys.pgBouncerStatus(projectRef),
    ({ signal }) => getPgBouncerStatus({ projectRef, dbHost }, signal),
    options
  )

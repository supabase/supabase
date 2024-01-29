import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { configKeys } from './keys'
import { ResponseError } from 'types'

type PgBouncerVariables = {
  projectRef: string
  dbHost: string
}

export async function getPgBouncerStatus({ dbHost }: PgBouncerVariables, signal?: AbortSignal) {
  if (!dbHost) {
    throw new Error('dbHost is required')
  }

  const response = await fetch(`http://${dbHost}:6543`, {
    signal,
  })

  return response
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

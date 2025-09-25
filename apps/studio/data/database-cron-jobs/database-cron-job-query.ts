import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { CronJob } from './database-cron-jobs-infinite-query'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobVariables = {
  projectRef?: string
  connectionString?: string | null
  id?: number
  name?: string
}

export async function getDatabaseCronJob({
  projectRef,
  connectionString,
  id,
  name,
}: DatabaseCronJobVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: !!id
      ? `SELECT * FROM cron.job where jobid = ${id};`
      : `SELECT * FROM cron.job where jobname = '${name}';`,
    queryKey: ['cron-job', id],
  })

  return result[0]
}

export type DatabaseCronJobData = CronJob
export type DatabaseCronJobError = ResponseError

export const useCronJobQuery = <TData = DatabaseCronJobData>(
  { projectRef, connectionString, id, name }: DatabaseCronJobVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobData, DatabaseCronJobError, TData> = {}
) =>
  useQuery<DatabaseCronJobData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.job(projectRef, id ?? name),
    () => getDatabaseCronJob({ projectRef, connectionString, id }),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        (typeof id !== 'undefined' || typeof name !== 'undefined'),
      ...options,
    }
  )

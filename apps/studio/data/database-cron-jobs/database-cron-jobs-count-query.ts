import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

type DatabaseCronJobsCountVariables = {
  projectRef?: string
  connectionString?: string | null
}

const cronJobCountSql = `select count(jobid) from cron.job;`.trim()

export async function getDatabaseCronJobsCount({
  projectRef,
  connectionString,
}: DatabaseCronJobsCountVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: cronJobCountSql,
    queryKey: ['cron-jobs-count'],
  })
  return result[0].count
}

export type DatabaseCronJobData = number
export type DatabaseCronJobError = ResponseError

export const useCronJobsCountQuery = <TData = DatabaseCronJobData>(
  { projectRef, connectionString }: DatabaseCronJobsCountVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobData, DatabaseCronJobError, TData> = {}
) =>
  useQuery<DatabaseCronJobData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.count(projectRef),
    () => getDatabaseCronJobsCount({ projectRef, connectionString }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
